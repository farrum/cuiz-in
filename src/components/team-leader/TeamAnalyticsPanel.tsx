import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Download, RefreshCw, TrendingUp, Target, Coins, Users } from 'lucide-react';
import { useTeamAnalytics, TeamAnalyticsMember } from '@/hooks/useTeamAnalytics';
import { downloadCSV } from '@/utils/excelUtils';

interface TeamAnalyticsPanelProps {
  members: TeamAnalyticsMember[];
  compact?: boolean;
}

type MetricKey = 'answers' | 'correct' | 'gems';

const RANGES = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
];

const METRICS: { key: MetricKey; label: string; color: string }[] = [
  { key: 'answers', label: 'Questions Attempted', color: 'hsl(var(--primary))' },
  { key: 'correct', label: 'Correct Answers', color: '#22c55e' },
  { key: 'gems', label: 'Gems Earned', color: '#f59e0b' },
];

const PIE_COLORS = ['#22c55e', '#ef4444'];

const TeamAnalyticsPanel: React.FC<TeamAnalyticsPanelProps> = ({ members, compact = false }) => {
  const [days, setDays] = useState(7);
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [metric, setMetric] = useState<MetricKey>('answers');
  const { rows, loading, error, refresh } = useTeamAnalytics(members, days);

  const nameOf = useMemo(() => {
    const map = new Map(members.map((m) => [m.id, m.name]));
    return (id: string) => map.get(id) || 'Member';
  }, [members]);

  const filtered = useMemo(
    () => (memberFilter === 'all' ? rows : rows.filter((r) => r.member_id === memberFilter)),
    [rows, memberFilter]
  );

  // Daily trend (full range, zero-filled)
  const trend = useMemo(() => {
    const byDay = new Map<string, { answers: number; correct: number; gems: number }>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      byDay.set(d.toISOString().slice(0, 10), { answers: 0, correct: 0, gems: 0 });
    }
    filtered.forEach((r) => {
      const key = String(r.day).slice(0, 10);
      const cur = byDay.get(key);
      if (!cur) return;
      cur.answers += r.answers;
      cur.correct += r.correct;
      cur.gems += r.gems;
    });
    return Array.from(byDay.entries()).map(([day, v]) => ({
      day: day.slice(5),
      ...v,
    }));
  }, [filtered, days]);

  // Per-member aggregates
  const perMember = useMemo(() => {
    const map = new Map<string, { id: string; name: string; answers: number; correct: number; gems: number; activeDays: number }>();
    filtered.forEach((r) => {
      const entry = map.get(r.member_id) || {
        id: r.member_id,
        name: nameOf(r.member_id),
        answers: 0,
        correct: 0,
        gems: 0,
        activeDays: 0,
      };
      entry.answers += r.answers;
      entry.correct += r.correct;
      entry.gems += r.gems;
      if (r.answers > 0 || r.gems > 0) entry.activeDays += 1;
      map.set(r.member_id, entry);
    });
    return Array.from(map.values()).sort((a, b) => b[metric] - a[metric]);
  }, [filtered, nameOf, metric]);

  const totals = useMemo(() => {
    const answers = filtered.reduce((s, r) => s + r.answers, 0);
    const correct = filtered.reduce((s, r) => s + r.correct, 0);
    const gems = filtered.reduce((s, r) => s + r.gems, 0);
    const activeMembers = new Set(filtered.filter((r) => r.answers > 0).map((r) => r.member_id)).size;
    return {
      answers,
      correct,
      gems,
      accuracy: answers > 0 ? Math.round((correct / answers) * 100) : 0,
      activeMembers,
    };
  }, [filtered]);

  const accuracyData = [
    { name: 'Correct', value: totals.correct },
    { name: 'Incorrect', value: Math.max(0, totals.answers - totals.correct) },
  ];

  const exportCsv = () => {
    downloadCSV(
      perMember.map((m) => ({
        Member: m.name,
        'Questions Attempted': m.answers,
        'Correct Answers': m.correct,
        Accuracy: `${m.answers > 0 ? Math.round((m.correct / m.answers) * 100) : 0}%`,
        'Gems Earned': m.gems,
        'Active Days': m.activeDays,
      })),
      `team-analytics-${days === 1 ? 'today-24h' : `last-${days}-days`}`
    );
  };

  const activeMetric = METRICS.find((m) => m.key === metric)!;
  const card = 'bg-stone-900/90 border border-stone-800 rounded-2xl p-4 shadow-lg';
  const axisStyle = { fontSize: 10, fill: 'hsl(var(--muted-foreground))' };

  return (
    <div className="space-y-4">
      {/* FILTER BAR */}
      <div className={`${card} flex flex-wrap items-center gap-2 justify-between`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1 bg-stone-950/60 p-1 rounded-xl">
            {RANGES.map((r) => (
              <button
                key={r.days}
                onClick={() => setDays(r.days)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-colors ${
                  days === r.days ? 'bg-amber-500 text-stone-950' : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="bg-stone-950/60 border border-stone-800 text-slate-200 text-[11px] font-bold rounded-lg px-2 py-2 max-w-[160px]"
            aria-label="Filter by squad member"
          >
            <option value="all">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            value={metric}
            onChange={(e) => setMetric(e.target.value as MetricKey)}
            className="bg-stone-950/60 border border-stone-800 text-slate-200 text-[11px] font-bold rounded-lg px-2 py-2"
            aria-label="Select metric"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={refresh}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-950/60 border border-stone-800 text-[11px] font-black uppercase text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-stone-950 text-[11px] font-black uppercase hover:bg-amber-400"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="text-[11px] font-bold text-red-400 bg-red-950/40 border border-red-900 rounded-xl p-3">
          {error}
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Questions Attempted', value: totals.answers, icon: TrendingUp, color: 'text-sky-400' },
          { label: 'Accuracy', value: `${totals.accuracy}%`, icon: Target, color: 'text-emerald-400' },
          { label: 'Gems Earned', value: totals.gems, icon: Coins, color: 'text-amber-400' },
          { label: 'Active Members', value: totals.activeMembers, icon: Users, color: 'text-violet-400' },
        ].map((k) => (
          <div key={k.label} className={card}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{k.label}</span>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
            <p className="text-[9px] text-slate-500 uppercase font-semibold mt-0.5">
              {days === 1 ? 'Last 24 Hours' : `Last ${days} days`}
            </p>
          </div>
        ))}
      </div>

      {/* TREND CHART */}
      <div className={card}>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-3">
          {activeMetric.label} — Daily Trend
        </h3>
        <div style={{ height: compact ? 200 : 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="metricFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeMetric.color} stopOpacity={0.55} />
                  <stop offset="95%" stopColor={activeMetric.color} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="day" tick={axisStyle} interval={days > 30 ? 9 : days > 7 ? 3 : 0} />
              <YAxis tick={axisStyle} allowDecimals={false} width={38} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'hsl(var(--popover-foreground))',
                }}
              />
              <Area
                type="monotone"
                dataKey={metric}
                name={activeMetric.label}
                stroke={activeMetric.color}
                strokeWidth={2}
                fill="url(#metricFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TOP PERFORMERS + ACCURACY SPLIT */}
      <div className={`grid gap-3 ${compact ? '' : 'lg:grid-cols-3'}`}>
        <div className={`${card} ${compact ? '' : 'lg:col-span-2'}`}>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-3">
            Top Performers ({activeMetric.label})
          </h3>
          <div style={{ height: compact ? 200 : 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perMember.slice(0, 8)} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={axisStyle} allowDecimals={false} width={38} />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
                <Bar dataKey={metric} name={activeMetric.label} fill={activeMetric.color} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={card}>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-3">Answer Quality</h3>
          <div style={{ height: compact ? 190 : 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={accuracyData} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
                  {accuracyData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 12,
                    fontSize: 12,
                    color: 'hsl(var(--popover-foreground))',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MEMBER BREAKDOWN TABLE */}
      <div className={`${card} overflow-x-auto`}>
        <h3 className="text-[11px] font-black uppercase tracking-widest text-amber-500 mb-3">Member Breakdown</h3>
        <table className="w-full text-left text-[11px] border-collapse min-w-[420px]">
          <thead>
            <tr className="text-[9px] uppercase font-black tracking-wider text-slate-400 border-b border-stone-800">
              <th className="pb-2 pr-2">Member</th>
              <th className="pb-2 px-2 text-center">Attempted</th>
              <th className="pb-2 px-2 text-center">Correct</th>
              <th className="pb-2 px-2 text-center">Accuracy</th>
              <th className="pb-2 px-2 text-center">Gems</th>
              <th className="pb-2 pl-2 text-center">Active Days</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-850">
            {perMember.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                  {loading ? 'Loading squad analytics…' : 'No activity recorded in this period'}
                </td>
              </tr>
            ) : (
              perMember.map((m) => (
                <tr key={m.id} className="hover:bg-stone-950/30">
                  <td className="py-2 pr-2 font-bold text-slate-200">{m.name}</td>
                  <td className="py-2 px-2 text-center text-sky-400 font-black">{m.answers}</td>
                  <td className="py-2 px-2 text-center text-emerald-400 font-black">{m.correct}</td>
                  <td className="py-2 px-2 text-center text-slate-300 font-bold">
                    {m.answers > 0 ? Math.round((m.correct / m.answers) * 100) : 0}%
                  </td>
                  <td className="py-2 px-2 text-center text-amber-400 font-black">{m.gems}</td>
                  <td className="py-2 pl-2 text-center text-violet-400 font-black">{m.activeDays}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamAnalyticsPanel;
