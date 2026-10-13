type TrendBarsProps = {
  labels: string[];
  values: number[];
  title: string;
  valueLabel?: string;
};

function shortDayLabel(dayKey: string): string {
  const [, month, day] = dayKey.split('-');
  return `${day}.${month}`;
}

export function TrendBars({ labels, values, title, valueLabel }: TrendBarsProps) {
  const max = Math.max(1, ...values);
  return (
    <div className="elev rounded-lg border border-border bg-card px-4 py-4">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <div className="mt-4 flex h-28 items-end gap-2" role="img" aria-label={title}>
        {labels.map((label, index) => {
          const value = values[index] ?? 0;
          const barPx = value > 0 ? Math.max(6, Math.round((value / max) * 88)) : 4;
          return (
            <div key={label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[0.65rem] tabular-nums text-muted-foreground">
                {value}
                {valueLabel ? ` ${valueLabel}` : ''}
              </span>
              <div
                className="w-full rounded-t bg-primary/80"
                style={{ height: `${barPx}px` }}
                title={`${label}: ${value}`}
              />
              <span className="text-[0.65rem] text-muted-foreground">{shortDayLabel(label)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
