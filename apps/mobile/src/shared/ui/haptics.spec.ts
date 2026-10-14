import { Vibration } from 'react-native';
import { triggerHaptic } from './haptics';

jest.spyOn(Vibration, 'vibrate').mockImplementation(jest.fn());

describe('triggerHaptic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('triggers light vibration by default', () => {
    triggerHaptic();
    expect(Vibration.vibrate).toHaveBeenCalled();
  });

  it('triggers distinct vibration patterns for success and error', () => {
    triggerHaptic('success');
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 15, 60, 25]);

    triggerHaptic('error');
    expect(Vibration.vibrate).toHaveBeenCalledWith([0, 35, 70, 40]);
  });
});
