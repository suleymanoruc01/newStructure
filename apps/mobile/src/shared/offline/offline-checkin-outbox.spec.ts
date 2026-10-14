import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  computeDeviceSignature,
  flushOfflineQueue,
  generateActionNonce,
  getOfflineQueue,
  queueOfflineAction,
  removeOfflineAction,
  verifyActionIntegrity,
  type OfflineCheckInAction,
} from './offline-checkin-outbox';

describe('offline-checkin-outbox', () => {
  const memoryStore = new Map<string, string>();

  beforeEach(() => {
    memoryStore.clear();
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) =>
      Promise.resolve(memoryStore.get(key) ?? null),
    );
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, val: string) => {
      memoryStore.set(key, val);
      return Promise.resolve();
    });
    (AsyncStorage.clear as jest.Mock).mockImplementation(() => {
      memoryStore.clear();
      return Promise.resolve();
    });
  });

  describe('cryptographic signatures & nonce generation', () => {
    it('generates nonces containing shift identifier and timestamp', () => {
      const now = 1718000000000;
      const nonce = generateActionNonce('shift-xyz', now);
      expect(nonce).toBeDefined();
      expect(typeof nonce).toBe('string');
      expect(nonce.length).toBeGreaterThan(12);
    });

    it('computes deterministic device signatures', () => {
      const now = 1718000000000;
      const sig1 = computeDeviceSignature('shift-1', 'check_in', now, 'nonce-abc');
      const sig2 = computeDeviceSignature('shift-1', 'check_in', now, 'nonce-abc');
      const sigDiff = computeDeviceSignature('shift-1', 'check_out', now, 'nonce-abc');

      expect(sig1).toBe(sig2);
      expect(sig1).not.toBe(sigDiff);
      expect(sig1.startsWith('sig_')).toBe(true);
    });

    it('detects tampered action payloads', () => {
      const now = Date.now();
      const nonce = generateActionNonce('shift-1', now);
      const signature = computeDeviceSignature('shift-1', 'check_in', now, nonce);

      const action: OfflineCheckInAction = {
        id: 'act_1',
        shiftId: 'shift-1',
        actionType: 'check_in',
        clientTimestamp: new Date(now).toISOString(),
        monotonicEpochMs: now,
        coords: { latitude: 41.0082, longitude: 28.9784 },
        nonce,
        deviceSignature: signature,
        retryCount: 0,
        status: 'pending',
      };

      const valid = verifyActionIntegrity(action, 86400000, now);
      expect(valid.valid).toBe(true);

      // Tampered shift ID
      const tampered = { ...action, shiftId: 'shift-tampered' };
      const invalid = verifyActionIntegrity(tampered, 86400000, now);
      expect(invalid.valid).toBe(false);
      expect(invalid.reason).toBe('SIGNATURE_MISMATCH');
    });

    it('flags expired and future timestamps', () => {
      const now = Date.now();
      const nonce = generateActionNonce('shift-1', now);
      const signature = computeDeviceSignature('shift-1', 'check_in', now, nonce);

      const action: OfflineCheckInAction = {
        id: 'act_1',
        shiftId: 'shift-1',
        actionType: 'check_in',
        clientTimestamp: new Date(now).toISOString(),
        monotonicEpochMs: now,
        coords: { latitude: 41.0082, longitude: 28.9784 },
        nonce,
        deviceSignature: signature,
        retryCount: 0,
        status: 'pending',
      };

      // Past expiration (older than maxAgeMs)
      const expired = verifyActionIntegrity(action, 60000, now + 120000);
      expect(expired.valid).toBe(false);
      expect(expired.reason).toBe('EXPIRED_ACTION');

      // Future timestamp beyond drift allowance
      const future = verifyActionIntegrity(action, 86400000, now - 100000);
      expect(future.valid).toBe(false);
      expect(future.reason).toBe('FUTURE_TIMESTAMP');
    });
  });

  describe('queue operations & flush lifecycle', () => {
    it('enqueues actions into persistent storage', async () => {
      const action = await queueOfflineAction({
        shiftId: 'shift-abc',
        actionType: 'check_in',
        coords: { latitude: 40.99, longitude: 29.02, accuracyMeters: 5 },
      });

      expect(action.id).toBeDefined();
      expect(action.shiftId).toBe('shift-abc');
      expect(action.status).toBe('pending');

      const stored = await getOfflineQueue();
      expect(stored.length).toBe(1);
      expect(stored[0].shiftId).toBe('shift-abc');
    });

    it('removes actions from persistent storage', async () => {
      const action = await queueOfflineAction({
        shiftId: 'shift-to-remove',
        actionType: 'check_out',
        coords: { latitude: 40.99, longitude: 29.02 },
      });

      await removeOfflineAction(action.id);
      const stored = await getOfflineQueue();
      expect(stored.length).toBe(0);
    });

    it('flushes pending actions via network executor and purges succeeded', async () => {
      await queueOfflineAction({
        shiftId: 'shift-success-1',
        actionType: 'check_in',
        coords: { latitude: 41.0, longitude: 29.0 },
      });
      await queueOfflineAction({
        shiftId: 'shift-success-2',
        actionType: 'check_out',
        coords: { latitude: 41.0, longitude: 29.0 },
      });

      const executor = jest.fn().mockResolvedValue(true);
      const result = await flushOfflineQueue(executor);

      expect(result.processed).toBe(2);
      expect(result.succeeded).toBe(2);
      expect(result.failed).toBe(0);
      expect(executor).toHaveBeenCalledTimes(2);

      const remaining = await getOfflineQueue();
      expect(remaining.length).toBe(0);
    });

    it('retains failing actions with incremented retry counts', async () => {
      await queueOfflineAction({
        shiftId: 'shift-failing',
        actionType: 'check_in',
        coords: { latitude: 41.0, longitude: 29.0 },
      });

      const failingExecutor = jest.fn().mockRejectedValue(new Error('Network timeout'));
      const result = await flushOfflineQueue(failingExecutor);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(1);

      const remaining = await getOfflineQueue();
      expect(remaining.length).toBe(1);
      expect(remaining[0].retryCount).toBe(1);
      expect(remaining[0].lastError).toBe('Network timeout');
    });
  });
});
