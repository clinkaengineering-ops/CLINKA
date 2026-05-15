/* Lightweight inline SVG charts — no dependencies */

export function AreaChart({ data, color = "#0ea5e9", height = 180 }: { data: number[]; color?: string; height?: number }) {
  const w = 600, h = height, pad = 8;
  const max = Math.max(...data) * 1.2;
  const min = 0;
  const step = (w - pad * 2) / (data.length - 1);
  const pts = data.map((v, i) => [pad + i * step, h - pad - ((v - min) / (max - min)) * (h - pad * 2)]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const area = `${path} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="areaG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((y, i) => (
        <line key={i} x1={pad} x2={w - pad} y1={h * y} y2={h * y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 4" />
      ))}
      <path d={area} fill="url(#areaG)" />
      <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={color} className="opacity-0 hover:opacity-100" />
      ))}
    </svg>
  );
}

export function BarChart({ data, labels, color = "#0ea5e9", height = 180 }: { data: number[]; labels?: string[]; color?: string; height?: number }) {
  const w = 600, h = height, pad = 16;
  const max = Math.max(...data) * 1.15;
  const bw = (w - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full">
      <defs>
        <linearGradient id="barG" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>
      {data.map((v, i) => {
        const bh = (v / max) * (h - pad);
        const x = pad + i * bw + bw * 0.18;
        const y = h - bh;
        return (
          <g key={i}>
            <rect x={x} y={y} width={bw * 0.64} height={bh} rx="4" fill="url(#barG)" />
            {labels && <text x={x + (bw * 0.32)} y={h + 16} textAnchor="middle" className="fill-slate-400 text-[10px]">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export function Donut({ value, color = "#0ea5e9", size = 120, label }: { value: number; color?: string; size?: number; label?: string }) {
  const r = 48;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size}>
      <circle cx="60" cy="60" r={r} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeWidth="10" fill="none" />
      <circle cx="60" cy="60" r={r} stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 60 60)" />
      <text x="60" y="58" textAnchor="middle" className="fill-slate-900 dark:fill-white font-bold text-2xl">{value}%</text>
      {label && <text x="60" y="76" textAnchor="middle" className="fill-slate-500 text-[10px] uppercase tracking-wider">{label}</text>}
    </svg>
  );
}
