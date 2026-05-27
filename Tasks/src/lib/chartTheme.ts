export const CHART_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#22c55e',
  '#f97316',
  '#e11d48',
  '#6366f1',
  '#a855f7',
];

export function getChartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/** Shared Recharts tooltip styling for light/dark themes. */
export const chartTooltipProps = {
  contentStyle: {
    backgroundColor: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
  },
  labelStyle: { color: 'var(--text-primary)' },
  itemStyle: { color: 'var(--text-primary)' },
};

/** Legend beside project pie charts — avoids overlapping slice labels. */
export const projectPieLegendProps = {
  layout: 'vertical' as const,
  verticalAlign: 'middle' as const,
  align: 'right' as const,
  iconType: 'circle' as const,
  iconSize: 8,
  wrapperStyle: {
    fontSize: 12,
    lineHeight: '1.4',
    color: 'var(--text-primary)',
    paddingLeft: 12,
    maxWidth: '52%',
  },
  formatter: (value: string, entry: { payload?: { value?: number } }) =>
    `${value}: ${entry.payload?.value ?? 0}`,
};

