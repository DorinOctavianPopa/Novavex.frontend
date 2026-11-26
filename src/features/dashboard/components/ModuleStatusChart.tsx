interface ModuleStatusChartProps {
  readonly readyCount: number;
  readonly plannedCount: number;
  readonly readyLabel: string;
  readonly plannedLabel: string;
}

// Material Dashboard 2-style stacked progress bar summarizing real feature-module
// status counts (no placeholder data here, unlike MiniAreaChart).
export function ModuleStatusChart({
  readyCount,
  plannedCount,
  readyLabel,
  plannedLabel,
}: Readonly<ModuleStatusChartProps>) {
  const total = readyCount + plannedCount;
  const readyPercent = total === 0 ? 0 : (readyCount / total) * 100;
  const plannedPercent = total === 0 ? 0 : 100 - readyPercent;

  return (
    <div className="module-status-chart">
      <div className="module-status-chart__bar">
        <span
          className="module-status-chart__segment module-status-chart__segment--ready"
          style={{ width: `${readyPercent}%` }}
        />
        <span
          className="module-status-chart__segment module-status-chart__segment--planned"
          style={{ width: `${plannedPercent}%` }}
        />
      </div>
      <ul className="module-status-chart__legend">
        <li>
          <span className="module-status-chart__dot module-status-chart__dot--ready" />
          {readyLabel}
          <strong>{readyCount}</strong>
        </li>
        <li>
          <span className="module-status-chart__dot module-status-chart__dot--planned" />
          {plannedLabel}
          <strong>{plannedCount}</strong>
        </li>
      </ul>
    </div>
  );
}
