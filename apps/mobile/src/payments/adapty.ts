import { Platform } from 'react-native';
import { adapty } from 'react-native-adapty';

let activatedKey = '';

export async function activateAdapty(
  publicKey: string,
  customerUserId?: string | null,
): Promise<void> {
  const key = publicKey.trim();
  if (!key || activatedKey === key) {
    return;
  }
  await adapty.activate(key, {
    customerUserId: customerUserId ?? undefined,
    logLevel: __DEV__ ? 'warn' : 'error',
    __ignoreActivationOnFastRefresh: __DEV__,
  });
  activatedKey = key;
}

export async function identifyAdapty(userId: string | null): Promise<void> {
  if (!activatedKey) {
    return;
  }
  if (userId) {
    await adapty.identify(userId);
    return;
  }
  await adapty.logout();
}

function latestPurchaseId(
  profile: {
    nonSubscriptions?: Record<string, Array<{ purchaseId?: string }>>;
  } | null
  | undefined,
  vendorIds: string[],
): string | undefined {
  const bag = profile?.nonSubscriptions;
  if (!bag) {
    return undefined;
  }
  for (const id of vendorIds.filter(Boolean)) {
    const rows = bag[id];
    const last = rows?.[rows.length - 1]?.purchaseId;
    if (last) {
      return last;
    }
  }
  for (const rows of Object.values(bag)) {
    const last = rows?.[rows.length - 1]?.purchaseId;
    if (last) {
      return last;
    }
  }
  return undefined;
}

export async function purchaseAdaptyProduct(input: {
  placementId: string;
  iosProductId: string;
  androidProductId: string;
  adaptyProductId: string;
}): Promise<{ cancelled: true } | { transactionId: string }> {
  const flow = await adapty.getFlow(input.placementId);
  const products = await adapty.getPaywallProducts(flow);
  const wanted =
    Platform.OS === 'ios' ? input.iosProductId : input.androidProductId;
  const product = products.find(
    (item) =>
      item.vendorProductId === wanted ||
      item.vendorProductId === input.adaptyProductId,
  );
  if (!product) {
    throw new Error('Adapty ürünü bulunamadı.');
  }
  const result = await adapty.makePurchase(product);
  const typed = result as {
    type?: string;
    profile?: {
      nonSubscriptions?: Record<string, Array<{ purchaseId?: string }>>;
    };
  };
  if (typed.type === 'user_cancelled') {
    return { cancelled: true };
  }
  if (typed.type && typed.type !== 'success') {
    throw new Error('Ödeme tamamlanmadı.');
  }
  const transactionId = latestPurchaseId(typed.profile, [
    wanted,
    input.adaptyProductId,
    input.iosProductId,
    input.androidProductId,
  ]);
  if (!transactionId) {
    throw new Error('İşlem kimliği alınamadı.');
  }
  return { transactionId };
}
