export type TextMeasure = {
  key: string;
  view: number;
  content: number;
  end: boolean;
};

export function measured(policyKey: string, current: TextMeasure | null): TextMeasure {
  if (current?.key === policyKey) {
    return current;
  }
  return { key: policyKey, view: 0, content: 0, end: false };
}

export function markIfFits(measure: TextMeasure): TextMeasure {
  if (measure.view > 0 && measure.content > 0 && measure.content <= measure.view + 8) {
    return { ...measure, end: true };
  }
  return measure;
}
