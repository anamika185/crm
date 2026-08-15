import { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';
import { Banknote, TrendingUp, Trophy, Briefcase, FileText, Phone, Mail, Check, CalendarClock } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import type { ActivityType } from '../types';
import { STAGE_LABELS, formatMoney, formatDateShort, timeAgo } from '../utils';

const AMBER = '#ecad0a';
const BLUE = '#209dd7';

const ACTIVITY_ICON: Record<ActivityType, typeof FileText> = {
  note: FileText,
  call: Phone,
  email: Mail
};

const ACTIVITY_COLOR: Record<ActivityType, { bg: string; color: string }> = {
  note: { bg: 'var(--amber-light)', color: 'var(--amber-dark)' },
  call: { bg: 'var(--blue-light)', color: 'var(--blue-dark)' },
  email: { bg: 'var(--purple-light)', color: 'var(--purple-dark)' }
};

export default function Dashboard() {
  const { data, loading, error, refresh } = useAsync(() => api.getDashboard(), []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading || !data) return <Loading />;
  if (error) return <ErrorBanner message={error} />;

  const toggleTask = async (id: number) => {
    setErrorMsg(null);
    try {
      await api.setActivityDone(id, true);
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const kpis = data.kpis;

  const funnelData = data.pipeline.map((p) => ({
    name: STAGE_LABELS[p.stage],
    value: p.expectedRevenue,
    count: p.count
  }));

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="How your sales are going" />
      {errorMsg && <ErrorBanner message={errorMsg} />}

      <div className="kpi-grid">
        <Kpi
          label="Pipeline value"
          value={formatMoney(kpis.pipelineValue)}
          sub={`${kpis.openDeals} open deal${kpis.openDeals === 1 ? '' : 's'}`}
          icon={<Banknote size={17} />}
          tone="amber"
        />
        <Kpi
          label="Expected revenue"
          value={formatMoney(kpis.expectedRevenue)}
          sub="weighted by probability"
          icon={<TrendingUp size={17} />}
          tone="blue"
        />
        <Kpi
          label="Deals won"
          value={String(kpis.wonCount)}
          sub={`${formatMoney(kpis.wonValue)} won`}
          icon={<Trophy size={17} />}
          tone="green"
        />
        <Kpi
          label="Follow-ups"
          value={String(kpis.overdueTasks + kpis.upcomingTasks)}
          sub={`${kpis.overdueTasks} overdue · ${kpis.upcomingTasks} upcoming`}
          icon={<Briefcase size={17} />}
          tone="purple"
        />
      </div>

      <div className="dash-row">
        <div className="card chart-box">
          <h3 className="card-title">Deals won per month</h3>
          <div className="cell-sub">Count of deals closed Won in the last 12 months</div>
          <div style={{ height: 220, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dealsWonPerMonth} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'var(--gray-50)' }} content={<ChartTip suffix=" deals won" />} />
                <Bar dataKey="count" fill={BLUE} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card chart-box">
          <h3 className="card-title">Revenue won per month</h3>
          <div className="cell-sub">Value of deals closed Won in the last 12 months</div>
          <div style={{ height: 220, marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dealsWonPerMonth} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-100)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `$${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} tick={{ fontSize: 11, fill: 'var(--gray-500)' }} axisLine={false} tickLine={false} width={54} />
                <Tooltip cursor={{ fill: 'var(--gray-50)' }} content={<MoneyTip />} />
                <Bar dataKey="revenue" fill={AMBER} radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="dash-row-3">
        <div className="card chart-box">
          <h3 className="card-title">Pipeline — expected revenue by stage</h3>
          <div className="cell-sub">Weighted by probability of close</div>
          <div style={{ height: 260, marginTop: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <Tooltip content={<FunnelTip />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="right" fill="var(--gray-700)" stroke="none" dataKey="name" fontSize={12} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Follow-up tasks</h3>
              <div className="cell-sub">Things due now and coming up</div>
            </div>
            <CalendarClock size={18} className="muted" />
          </div>
          <div className="task-list">
            {data.tasks.overdue.length === 0 && data.tasks.upcoming.length === 0 ? (
              <div className="empty-row">No pending follow-ups. Nice and clear!</div>
            ) : (
              <>
                {data.tasks.overdue.length > 0 && (
                  <TaskGroupLabel label={`Overdue (${data.tasks.overdue.length})`} tone="overdue" />
                )}
                {data.tasks.overdue.map((t) => (
                  <TaskRow key={t.id} label={t.description} related={t.deal_name ?? t.contact_first_name ? `${t.deal_name ? `${t.deal_name} · ` : ''}${t.contact_first_name ?? ''} ${t.contact_last_name ?? ''}` : ''} due={t.due_date} overdue onToggle={() => toggleTask(t.id)} />
                ))}
                {data.tasks.upcoming.length > 0 && (
                  <TaskGroupLabel label={`Upcoming (${data.tasks.upcoming.length})`} tone="upcoming" />
                )}
                {data.tasks.upcoming.map((t) => (
                  <TaskRow key={t.id} label={t.description} related={t.deal_name ?? t.contact_first_name ? `${t.deal_name ? `${t.deal_name} · ` : ''}${t.contact_first_name ?? ''} ${t.contact_last_name ?? ''}` : ''} due={t.due_date} onToggle={() => toggleTask(t.id)} />
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Recent activity</h3>
            <div className="cell-sub">Latest notes, calls and emails across everything</div>
          </div>
        </div>
        <div className="activity-feed">
          {data.recentActivity.map((a) => {
            const Icon = ACTIVITY_ICON[a.type];
            const tone = ACTIVITY_COLOR[a.type];
            const related =
              [a.deal_name, a.contact_first_name ? `${a.contact_first_name} ${a.contact_last_name}` : null, a.organization_name]
                .filter(Boolean)
                .join(' · ') || 'General';
            return (
              <div className="feed-item" key={a.id}>
                <span className="feed-icon" style={{ background: tone.bg, color: tone.color }}>
                  <Icon size={15} />
                </span>
                <div className="feed-text">
                  <div className="feed-line">
                    <strong style={{ textTransform: 'capitalize' }}>{a.type}</strong>
                    {' — '}
                    {a.description}
                  </div>
                  <div className="feed-meta">
                    {related} · {timeAgo(a.happened_at)}
                    {a.due_date && !a.done ? ` · due ${formatDateShort(a.due_date)}` : ''}
                  </div>
                </div>
              </div>
            );
          })}
          {data.recentActivity.length === 0 && <div className="empty-row">No activity yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  icon,
  tone
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: 'amber' | 'blue' | 'green' | 'purple';
}) {
  const tones: Record<string, { bg: string; color: string }> = {
    amber: { bg: 'var(--amber-light)', color: 'var(--amber-dark)' },
    blue: { bg: 'var(--blue-light)', color: 'var(--blue-dark)' },
    green: { bg: '#e4f4ea', color: '#1e7a45' },
    purple: { bg: 'var(--purple-light)', color: 'var(--purple-dark)' }
  };
  const t = tones[tone];
  return (
    <div className="card kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className="kpi-icon" style={{ background: t.bg, color: t.color }}>
          {icon}
        </span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-sub">{sub}</div>
    </div>
  );
}

function TaskGroupLabel({ label, tone }: { label: string; tone: 'overdue' | 'upcoming' }) {
  return (
    <div
      style={{
        padding: '8px 20px 2px',
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: tone === 'overdue' ? '#c0392b' : 'var(--blue-dark)'
      }}
    >
      {label}
    </div>
  );
}

function TaskRow({
  label,
  related,
  due,
  overdue,
  onToggle
}: {
  label: string;
  related: string;
  due: string | null;
  overdue?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="task-item">
      <button className={`checkbox ${overdue ? 'overdue-check' : ''}`} onClick={onToggle} aria-label={`Mark “${label}” as done`}>
        <Check size={13} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="task-item-label">{label}</div>
        {related && <div className="cell-sub">{related}</div>}
      </div>
      <span className={`task-due ${overdue ? 'overdue' : 'upcoming'}`}>{overdue ? 'Overdue' : formatDateShort(due)}</span>
    </div>
  );
}

function ChartTip({ active, payload, label, suffix }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '8px 12px', boxShadow: 'var(--shadow)' }}>
      <div className="cell-sub">{label}</div>
      <div style={{ fontWeight: 700 }}>{payload[0].value}{suffix ?? ''}</div>
    </div>
  );
}

function MoneyTip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card" style={{ padding: '8px 12px', boxShadow: 'var(--shadow)' }}>
      <div className="cell-sub">{label}</div>
      <div style={{ fontWeight: 700 }}>{formatMoney(payload[0].value)}</div>
    </div>
  );
}

function FunnelTip({ active, payload }: { active?: boolean; payload?: Array<{ name?: string; value?: number; payload?: { count?: number } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="card" style={{ padding: '8px 12px', boxShadow: 'var(--shadow)' }}>
      <div className="cell-sub">{item.name} · {item.payload?.count} deal{item.payload?.count === 1 ? '' : 's'}</div>
      <div style={{ fontWeight: 700 }}>{formatMoney(Number(item.value))}</div>
    </div>
  );
}