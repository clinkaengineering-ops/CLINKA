/* Lightweight inline SVG charts — no dependencies */

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n * 10) / 10);
}

export function ChartMeta({
  items,
  breakdown,
  note,
}: {
  items: { label: string; value: string }[];
  breakdown?: { label: string; value: string }[];
  note?: string;
}) {
  return (
    <div className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {item.label}
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
          </div>
        ))}
      </div>
      {breakdown && breakdown.length > 0 && (
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Period breakdown
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 text-xs">
            {breakdown.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2">
                <span className="text-slate-500 truncate">{row.label}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 shrink-0">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {note && <p className="text-xs text-slate-500 leading-relaxed">{note}</p>}
    </div>
  );
}

export function AreaChart({
  data,
  labels,
  color = "#196481",
  height = 180,
  formatValue = formatCompact,
  yAxisLabel,
}: {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
  yAxisLabel?: string;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const w = 600;
  const h = height;
  const padL = 36;
  const padR = 8;
  const padB = labels ? 22 : 8;
  const padT = 18;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...data, 1) * 1.15;
  const min = 0;
  const step = data.length > 1 ? chartW / (data.length - 1) : 0;
  const pts = data.map((v, i) => [
    padL + i * step,
    padT + chartH - ((v - min) / (max - min)) * chartH,
  ]);
  const path = pts
    .map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`))
    .join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${padT + chartH} L${pts[0][0]},${padT + chartH} Z`;

  const labelStep = labels && labels.length > 6 ? Math.ceil(labels.length / 6) : 1;
  const maxIdx = data.indexOf(Math.max(...data));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((ratio, i) => {
        const y = padT + chartH * (1 - ratio);
        const val = max * ratio;
        return (
          <g key={i}>
            <line
              x1={padL}
              x2={w - padR}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeDasharray="4 4"
            />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              className="fill-slate-400 text-[9px]"
            >
              {formatValue(val)}
            </text>
          </g>
        );
      })}
      {yAxisLabel && (
        <text
          x={4}
          y={padT + chartH / 2}
          textAnchor="middle"
          transform={`rotate(-90 4 ${padT + chartH / 2})`}
          className="fill-slate-400 text-[9px]"
        >
          {yAxisLabel}
        </text>
      )}
      <path d={area} fill="url(#areaG)" />
      <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={i === maxIdx || i === pts.length - 1 ? 4 : 2.5} fill={color}>
            <title>
              {labels?.[i] ?? `Point ${i + 1}`}: {formatValue(data[i])}
            </title>
          </circle>
          {(i === maxIdx || i === pts.length - 1) && data[i] > 0 && (
            <text
              x={x}
              y={y - 8}
              textAnchor="middle"
              className="fill-slate-600 dark:fill-slate-300 text-[9px] font-semibold"
            >
              {formatValue(data[i])}
            </text>
          )}
        </g>
      ))}
      {labels?.map((label, i) =>
        i % labelStep === 0 || i === labels.length - 1 ? (
          <text
            key={label + i}
            x={pts[i][0]}
            y={h - 4}
            textAnchor="middle"
            className="fill-slate-400 text-[9px]"
          >
            {label}
          </text>
        ) : null,
      )}
    </svg>
  );
}

export function BarChart({
  data,
  labels,
  color = "#196481",
  height = 180,
  formatValue = formatCompact,
}: {
  data: number[];
  labels?: string[];
  color?: string;
  height?: number;
  formatValue?: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs text-slate-500"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const w = 600;
  const h = height;
  const padL = 8;
  const padR = 8;
  const padB = 24;
  const padT = 20;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;
  const max = Math.max(...data, 1) * 1.2;
  const bw = chartW / data.length;

  return (
    <svg viewBox={`0 0 ${w} ${h + 8}`} className="w-full">
      <defs>
        <linearGradient id="barG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const bh = (v / max) * chartH;
        const x = padL + i * bw + bw * 0.16;
        const barW = bw * 0.68;
        const y = padT + chartH - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={Math.max(bh, v > 0 ? 2 : 0)} rx="4" fill="url(#barG)">
              <title>
                {labels?.[i] ?? `Item ${i + 1}`}: {formatValue(v)}
              </title>
            </rect>
            {v > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-slate-600 dark:fill-slate-300 text-[9px] font-semibold"
              >
                {formatValue(v)}
              </text>
            )}
            {labels && (
              <text
                x={x + barW / 2}
                y={padT + chartH + 14}
                textAnchor="middle"
                className="fill-slate-400 text-[10px]"
              >
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({
  value,
  color = "#196481",
  size = 120,
  label,
  subLabel,
}: {
  value: number;
  color?: string;
  size?: number;
  label?: string;
  subLabel?: string;
}) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const offset = c - (Math.min(Math.max(value, 0), 100) / 100) * c;

  return (
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <circle
        cx="60"
        cy="60"
        r={r}
        stroke="currentColor"
        className="text-slate-200 dark:text-slate-800"
        strokeWidth="10"
        fill="none"
      />
      <circle
        cx="60"
        cy="60"
        r={r}
        stroke={color}
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
        transform="rotate(-90 60 60)"
      />
      <text
        x="60"
        y={subLabel ? 54 : 58}
        textAnchor="middle"
        className="fill-slate-900 dark:fill-white font-bold text-2xl"
      >
        {Math.round(value)}%
      </text>
      {label && (
        <text
          x="60"
          y={subLabel ? 68 : 76}
          textAnchor="middle"
          className="fill-slate-500 text-[10px] uppercase tracking-wider"
        >
          {label}
        </text>
      )}
      {subLabel && (
        <text x="60" y="82" textAnchor="middle" className="fill-slate-400 text-[8px]">
          {subLabel}
        </text>
      )}
    </svg>
  );
}

export function seriesStats(values: number[]) {
  if (values.length === 0) return { total: 0, max: 0, maxIndex: 0, avg: 0, min: 0 };
  const total = values.reduce((sum, n) => sum + n, 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const maxIndex = values.indexOf(max);
  return { total, max, min, maxIndex, avg: total / values.length };
}
