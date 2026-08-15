import type { ContactStatus, Stage, ActivityType } from '../types';
import { STAGE_LABELS } from '../utils';
import { initials } from '../utils';

const STATUS_LABELS: Record<ContactStatus, string> = {
  lead: 'Lead',
  qualified: 'Qualified',
  customer: 'Customer'
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  return <span className={`badge status-${status}`}>{STATUS_LABELS[status]}</span>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <span className={`badge stage-${stage}`}>{STAGE_LABELS[stage]}</span>;
}

export function TypeBadge({ type }: { type: ActivityType }) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return <span className={`badge badge-${type === 'note' ? 'amber' : type === 'call' ? 'blue' : 'purple'}`}>{label}</span>;
}

const AVATAR_COLORS = ['avatar-blue', 'avatar-purple', 'avatar-amber'];

export function Avatar({ first, last, size }: { first: string; last: string; size?: number }) {
  const hash = (first + last).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = AVATAR_COLORS[hash % AVATAR_COLORS.length];
  return (
    <span className={`avatar ${color}`} style={size ? { width: size, height: size, fontSize: size * 0.34 } : undefined} aria-hidden>
      {initials(first, last)}
    </span>
  );
}