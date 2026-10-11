/** Press scale for controls. Frequent screens stay still when motion is reduced. */
export function pressTarget(reduceMotion: boolean, pressed: boolean): number {
  if (reduceMotion || !pressed) {
    return 1;
  }
  return 0.97;
}

export const PRESS_MS = 160;
