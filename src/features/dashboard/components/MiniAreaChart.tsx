interface MiniAreaChartProps {
  /** Values normalized to the 0-1 range; rendered left to right. */
  readonly points: readonly number[];
  readonly gradientId: string;
  readonly stroke: string;
  readonly fill: string;
}

const viewWidth = 260;
const viewHeight = 88;

// Lightweight SVG sparkline used as a Material Dashboard 2-style chart placeholder.
// No charting library is pulled in for this: the dashboard has no live time-series
// metric yet, so this renders a representative trend from static sample data.
export function MiniAreaChart({
  points,
  gradientId,
  stroke,
  fill,
}: Readonly<MiniAreaChartProps>) {
  const stepX = viewWidth / (points.length - 1);
  const coords = points.map((value, index) => {
    const x = index * stepX;
    const y = viewHeight - value * viewHeight;
    return [x, y] as const;
  });
  const linePath = coords
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x},${y}`)
    .join(" ");
  const areaPath = `${linePath} L${viewWidth},${viewHeight} L0,${viewHeight} Z`;

  return (
    <svg
      className="mini-area-chart"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.45" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
