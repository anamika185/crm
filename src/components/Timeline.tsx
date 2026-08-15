import { FileText, Phone, Mail, CalendarClock, Trash2, Check } from 'lucide-react';
import type { ActivityRow, ActivityType } from '../types';
import { formatDateTime, formatDateShort, isOverdue, timeAgo } from '../utils';

const TYPE_ICON: Record<ActivityType, typeof FileText> = {
  note: FileText,
  call: Phone,
  email: Mail
};

export function Timeline({
  activities,
  onToggleDone,
  onDelete
}: {
  activities: ActivityRow[];
  onToggleDone: (id: number, done: boolean) => Promise<void> | void;
  onDelete?: (id: number) => Promise<void> | void;
}) {
  if (activities.length === 0) {
    return (
      <div className="card card-pad muted" style={{ textAlign: 'center' }}>
        No activity logged yet.
      </div>
    );
  }

  return (
    <div className="timeline">
      {activities.map((a) => {
        const Icon = TYPE_ICON[a.type];
        const overdue = isOverdue(a.due_date);
        return (
          <div className="timeline-item" key={a.id}>
            <span className={`timeline-icon timeline-type-${a.type}`}>
              <Icon size={15} />
            </span>
            <div className="timeline-body">
              <div className="timeline-meta">
                <span className={`timeline-type-label timeline-type-${a.type}`} style={{ textTransform: 'capitalize' }}>
                  {a.type}
                </span>
                <span className="timeline-when" title={formatDateTime(a.happened_at)}>
                  {timeAgo(a.happened_at)}
                </span>
              </div>
              <div className="timeline-desc">{a.description}</div>
              <div className="timeline-tags">
                {a.contact_first_name && (
                  <span className="badge badge-gray">
                    {a.contact_first_name} {a.contact_last_name}
                  </span>
                )}
                {a.deal_name && <span className="badge badge-gray">{a.deal_name}</span>}
                {a.organization_name && <span className="badge badge-gray">{a.organization_name}</span>}
                {a.due_date && (
                  <span
                    className={`badge ${a.done ? 'badge-green' : overdue ? 'badge-red' : 'badge-blue'}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    <CalendarClock size={12} />
                    {a.done ? 'Done' : overdue ? `Overdue ${formatDateShort(a.due_date)}` : `Due ${formatDateShort(a.due_date)}`}
                  </span>
                )}
                {a.due_date && (
                  <button
                    className={`task-toggle ${a.done ? 'done' : ''}`}
                    onClick={() => onToggleDone(a.id, !a.done)}
                    aria-label={a.done ? 'Mark as not done' : 'Mark as done'}
                  >
                    {a.done && <Check size={12} />}
                    {a.done ? 'Done' : 'Mark done'}
                  </button>
                )}
                {onDelete && (
                  <button
                    className="task-toggle"
                    style={{ color: 'var(--gray-500)' }}
                    onClick={() => onDelete(a.id)}
                    aria-label="Delete activity"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}