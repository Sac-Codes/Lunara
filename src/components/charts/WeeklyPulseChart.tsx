import React from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, PenLine } from 'lucide-react';
import { CalmHorizonOrb } from '../graphics/LunarArtwork';
import { formatAxisDate } from '../../lib/date';
import type { CheckInEntry } from '../../types/lunara';

interface WeeklyPulseChartProps {
  entries: CheckInEntry[];
  height?: number;
}

interface ChartPoint {
  date: string;
  label: string;
  happiness: number | null;
  energy: number | null;
  stress: number | null;
}

export const WeeklyPulseChart: React.FC<WeeklyPulseChartProps> = ({
  entries,
  height = 220,
}) => {
  const data: ChartPoint[] = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7)
    .map((entry) => ({
      date: entry.date,
      label: formatAxisDate(entry.date),
      happiness: entry.happiness,
      energy: entry.energy,
      stress: entry.stress,
    }));

  if (data.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-7 px-4 rounded-[18px] bg-[var(--surface-main)]/55 border border-[var(--border-subtle)]">
        <div className="w-24 mb-2">
          <CalmHorizonOrb className="w-full h-auto" />
        </div>
        <p className="font-display text-lg font-medium text-[var(--text-primary)]">
          Your journey is ready to unfold
        </p>
        <p className="mt-1 text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm">
          Once you record at least two check-ins, your personal happiness, energy, and stress rhythm will appear here.
        </p>
        <Link
          to="/check-in"
          className="mt-3.5 inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-[11px] bg-[#56348D] text-white dark:bg-[#9B70DC] dark:text-[#11163D] text-xs font-medium hover:opacity-95 transition-opacity"
        >
          <PenLine className="w-3.5 h-3.5" />
          <span>Record a check-in</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-3 text-xs font-medium text-[var(--text-secondary)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#76BBAA]" aria-hidden="true" />
          Happiness
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#9B70DC]" aria-hidden="true" />
          Energy
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#DF9189]" aria-hidden="true" />
          Stress
        </span>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 10, left: -24, bottom: 2 }}>
            <defs>
              <linearGradient id="pulseHappinessFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#76BBAA" stopOpacity={0.34} />
                <stop offset="95%" stopColor="#76BBAA" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="pulseEnergyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9B70DC" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#9B70DC" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              dy={6}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                return (
                  <div className="rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-3.5 py-2.5 shadow-lg text-xs">
                    <div className="font-medium text-[var(--text-primary)] mb-1.5">{label}</div>
                    <div className="space-y-1">
                      {payload.map((item) => (
                        <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                            <span
                              className="w-2 h-2 rounded-xs"
                              style={{ backgroundColor: item.color }}
                            />
                            {item.name}
                          </span>
                          <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                            {item.value ?? '—'} / 5
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="happiness"
              name="Happiness"
              stroke="#76BBAA"
              strokeWidth={2.5}
              fill="url(#pulseHappinessFill)"
              dot={{ r: 3.5, fill: '#76BBAA', strokeWidth: 0 }}
              activeDot={{ r: 5.5, stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="energy"
              name="Energy"
              stroke="#9B70DC"
              strokeWidth={2.5}
              fill="url(#pulseEnergyFill)"
              dot={{ r: 3.5, fill: '#9B70DC', strokeWidth: 0 }}
              activeDot={{ r: 5.5, stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="stress"
              name="Stress"
              stroke="#DF9189"
              strokeWidth={2.3}
              fillOpacity={0}
              dot={{ r: 3.2, fill: '#DF9189', strokeWidth: 0 }}
              activeDot={{ r: 5.5, stroke: '#FFFFFF', strokeWidth: 2 }}
              connectNulls
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
