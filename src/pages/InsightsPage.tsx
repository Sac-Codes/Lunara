import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ArrowRight, Compass, PenLine, Sparkles } from 'lucide-react';
import { PageHeader } from '../components/shared/PageHeader';
import { Button } from '../components/ui/Button';
import { MOOD_DEFINITIONS, MOOD_MAP } from '../data/sampleJourney';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { addDays, formatAxisDate, toDateKey } from '../lib/date';
import { useLunara } from '../providers/LunaraProvider';

type TimeRange = '7d' | '30d' | 'all';

function averageMetric(values: Array<number | null>): string {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length === 0) return '—';
  const sum = valid.reduce((a, b) => a + b, 0);
  return (sum / valid.length).toFixed(1);
}

export const InsightsPage: React.FC = () => {
  const { dataMode, checkIns, journals, loadSampleJourney, dailyWisdom } = useLunara();
  const [range, setRange] = useState<TimeRange>('30d');

  const todayKey = toDateKey();

  const filteredCheckIns = useMemo(() => {
    const sorted = [...checkIns].sort((a, b) => a.date.localeCompare(b.date));
    if (range === 'all') return sorted;
    const cutoff = addDays(todayKey, range === '7d' ? -6 : -29);
    return sorted.filter((c) => c.date >= cutoff);
  }, [checkIns, range, todayKey]);

  const filteredJournals = useMemo(() => {
    if (range === 'all') return journals;
    const cutoff = addDays(todayKey, range === '7d' ? -6 : -29);
    return journals.filter((j) => j.date >= cutoff);
  }, [journals, range, todayKey]);

  const avgHappiness = useMemo(
    () => averageMetric(filteredCheckIns.map((c) => c.happiness)),
    [filteredCheckIns]
  );
  const avgEnergy = useMemo(
    () => averageMetric(filteredCheckIns.map((c) => c.energy)),
    [filteredCheckIns]
  );
  const avgStress = useMemo(
    () => averageMetric(filteredCheckIns.map((c) => c.stress)),
    [filteredCheckIns]
  );

  const trendData = useMemo(
    () =>
      filteredCheckIns.map((c) => ({
        date: c.date,
        label: formatAxisDate(c.date),
        happiness: c.happiness,
        energy: c.energy,
        stress: c.stress,
      })),
    [filteredCheckIns]
  );

  const moodCounts = useMemo(() => {
    const counts = new Map<string, number>();
    filteredCheckIns.forEach((c) => {
      if (c.mood) counts.set(c.mood, (counts.get(c.mood) || 0) + 1);
    });
    return MOOD_DEFINITIONS.map((m) => ({
      id: m.id,
      name: m.label,
      count: counts.get(m.id) || 0,
      color: m.accentHex,
    })).filter((m) => m.count > 0);
  }, [filteredCheckIns]);

  const topLikes = useMemo(() => {
    const freq = new Map<string, number>();
    filteredCheckIns.forEach((c) =>
      c.likes.forEach((item) => freq.set(item, (freq.get(item) || 0) + 1))
    );
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredCheckIns]);

  const topDislikes = useMemo(() => {
    const freq = new Map<string, number>();
    filteredCheckIns.forEach((c) =>
      c.dislikes.forEach((item) => freq.set(item, (freq.get(item) || 0) + 1))
    );
    return Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [filteredCheckIns]);

  const hasEnoughForCharts = filteredCheckIns.length >= 2;

  return (
    <div className="space-y-6 lg:space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Patterns across your days"
        description="Gentle summaries built strictly from what you have recorded—nothing inferred, nothing judged."
        artwork={LUNARA_ARTWORK.evening}
        needsEdgeCrop
        action={
          <div
            role="group"
            aria-label="Insights timeframe"
            className="inline-flex items-center gap-1 p-1 rounded-[14px] bg-[#11163D]/70 backdrop-blur-sm border border-white/15"
          >
            {[
              { id: '7d' as const, label: '7 days' },
              { id: '30d' as const, label: '30 days' },
              { id: 'all' as const, label: 'All' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setRange(opt.id)}
                className={`min-h-[36px] px-3 rounded-[10px] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  range === opt.id
                    ? 'bg-[#9B70DC] text-white'
                    : 'text-[#E5D4F7]/85 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        }
      />

      {/* Real Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-[20px] bg-[var(--surface-blue)] p-5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Check-ins recorded</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--blue-strong)]">
            {filteredCheckIns.length}
          </div>
        </div>

        <div className="rounded-[20px] bg-[var(--surface-rose)] p-5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Journal entries</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--rose-strong)]">
            {filteredJournals.length}
          </div>
        </div>

        <div className="rounded-[20px] bg-[var(--surface-teal)] p-5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Avg. happiness</div>
          <div className="mt-2 font-display text-3xl font-medium tabular-nums text-[var(--teal-strong)]">
            {avgHappiness}
            {avgHappiness !== '—' && <span className="text-sm font-sans opacity-75"> / 5</span>}
          </div>
        </div>

        <div className="rounded-[20px] bg-[var(--surface-amber)] p-5">
          <div className="text-xs font-medium text-[var(--text-secondary)]">
            Avg. energy / stress
          </div>
          <div className="mt-2 font-display text-2xl sm:text-3xl font-medium tabular-nums text-[var(--amber-strong)]">
            {avgEnergy}
            <span className="text-sm font-sans opacity-60 mx-1.5">/</span>
            <span className="text-[var(--coral-strong)]">{avgStress}</span>
          </div>
        </div>
      </section>

      {!hasEnoughForCharts ? (
        <section className="rounded-[28px] bg-[var(--surface-teal)] p-7 sm:p-10">
          <h2 className="font-display text-2xl font-medium text-[var(--text-primary)]">
            Your patterns will begin to appear as you record more days
          </h2>
          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] max-w-2xl">
            {filteredCheckIns.length === 1
              ? 'You have one check-in recorded in this timeframe. A second check-in will unlock trend charts and mood comparisons.'
              : 'No check-ins are recorded in this timeframe yet. Once you record a couple of days, Lunara will visualize your happiness, energy, stress, and recurring themes here.'}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/check-in">
              <Button
                variant="teal"
                size="md"
                leftIcon={<PenLine className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Record a check-in
              </Button>
            </Link>
            {dataMode === 'demo' && checkIns.length === 0 && (
              <Button
                variant="outline"
                size="md"
                onClick={loadSampleJourney}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Preview with sample week
              </Button>
            )}
          </div>
        </section>
      ) : (
        <>
          {/* Trend Chart + Mood Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <section className="lg:col-span-8 rounded-[26px] bg-[var(--surface-blue)] p-6 sm:p-7 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-primary)]">
                    Wellbeing rhythm
                  </h2>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    Happiness, energy, and stress across recorded days.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#76BBAA]" /> Happiness
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#E5B26F]" /> Energy
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#DF9189]" /> Stress
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -24, bottom: 2 }}>
                    <defs>
                      <linearGradient id="insHappiness" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#76BBAA" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#76BBAA" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border-subtle)" strokeDasharray="3 4" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                      dy={6}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || payload.length === 0) return null;
                        return (
                          <div className="rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-3.5 py-2.5 shadow-lg text-xs">
                            <div className="font-medium text-[var(--text-primary)] mb-1.5">{label}</div>
                            {payload.map((item) => (
                              <div key={String(item.dataKey)} className="flex items-center justify-between gap-4 py-0.5">
                                <span className="text-[var(--text-secondary)]">{item.name}</span>
                                <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                                  {item.value ?? '—'} / 5
                                </span>
                              </div>
                            ))}
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
                      fill="url(#insHappiness)"
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="energy"
                      name="Energy"
                      stroke="#E5B26F"
                      strokeWidth={2.4}
                      fillOpacity={0}
                      connectNulls
                    />
                    <Area
                      type="monotone"
                      dataKey="stress"
                      name="Stress"
                      stroke="#DF9189"
                      strokeWidth={2.4}
                      fillOpacity={0}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Mood Breakdown */}
            <section className="lg:col-span-4 rounded-[26px] bg-[var(--surface-lavender)] p-6 sm:p-7 shadow-[var(--shadow-card)] flex flex-col justify-between">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-medium text-[var(--text-primary)]">
                  Mood presence
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  How often each feeling showed up.
                </p>

                {moodCounts.length > 0 ? (
                  <div className="mt-5 h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={moodCounts}
                        layout="vertical"
                        margin={{ top: 0, right: 16, left: 6, bottom: 0 }}
                      >
                        <XAxis type="number" allowDecimals={false} hide />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={74}
                          tick={{ fill: 'var(--text-primary)', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'var(--border-subtle)' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const d = payload[0].payload as (typeof moodCounts)[number];
                            return (
                              <div className="rounded-[12px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-3 py-2 text-xs shadow-md">
                                <span className="font-medium text-[var(--text-primary)]">{d.name}:</span>{' '}
                                <span className="tabular-nums text-[var(--text-secondary)]">
                                  {d.count} {d.count === 1 ? 'day' : 'days'}
                                </span>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={20}>
                          {moodCounts.map((entry) => (
                            <Cell key={entry.id} fill={MOOD_MAP[entry.id].accentHex} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-[var(--text-secondary)]">
                    No mood labels selected in these check-ins yet.
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* Recurring Themes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="rounded-[24px] bg-[var(--surface-teal)] p-6">
              <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                What nourished you
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Most noted positives across this period.
              </p>

              {topLikes.length > 0 ? (
                <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
                  {topLikes.map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-[var(--text-primary)] font-medium">{label}</span>
                      <span className="tabular-nums text-xs text-[var(--teal-strong)] font-semibold">
                        {count} {count === 1 ? 'day' : 'days'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  Add likes during check-ins to notice what lifts your days.
                </p>
              )}
            </section>

            <section className="rounded-[24px] bg-[var(--surface-rose)] p-6">
              <h3 className="font-display text-xl font-medium text-[var(--text-primary)]">
                What felt heavier
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Recurring friction points you noticed.
              </p>

              {topDislikes.length > 0 ? (
                <ul className="mt-4 divide-y divide-[var(--border-subtle)]">
                  {topDislikes.map(([label, count]) => (
                    <li key={label} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="text-[var(--text-primary)] font-medium">{label}</span>
                      <span className="tabular-nums text-xs text-[var(--rose-strong)] font-semibold">
                        {count} {count === 1 ? 'day' : 'days'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--text-secondary)]">
                  No friction points noted in this period.
                </p>
              )}
            </section>
          </div>
        </>
      )}

      {dailyWisdom && (
        <section className="rounded-[24px] bg-[var(--surface-amber)]/80 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--amber-strong)]">
              <Compass className="w-3.5 h-3.5" />
              <span>Reflective companion · Bhagavad Gita {dailyWisdom.chapter}:{dailyWisdom.verse}</span>
            </div>
            <p className="font-display text-lg font-medium text-[var(--text-primary)]">
              {dailyWisdom.takeaway}
            </p>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
              {dailyWisdom.reflectionPrompt}
            </p>
          </div>
          <Link to="/wisdom" className="shrink-0">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Explore wisdom
            </Button>
          </Link>
        </section>
      )}

      <p className="text-xs text-[var(--text-muted)] text-center pt-2">
        Lunara reflects only the observations you choose to record—meant for personal awareness, never as a score or diagnosis.
      </p>
    </div>
  );
};
