import type { Stage } from './types';

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'New',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost'
};

const moneyFmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
const moneyFmtCents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatMoney(value: number): string {
  return moneyFmt.format(value);
}

export function formatMoneyCents(value: number): string {
  return moneyFmtCents.format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const dateShortFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateFmt.format(d);
}

export function formatDateShort(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return dateShortFmt.format(d);
}

export function formatDateTime(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return `${dateFmt.format(d)} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export function timeAgo(value: string): string {
  const d = new Date(value).getTime();
  const diff = Date.now() - d;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return formatDateShort(value);
}

export function isOverdue(value: string | null): boolean {
  if (!value) return false;
  return value.slice(0, 10) < new Date().toISOString().slice(0, 10);
}

export function fullName(row: { first_name: string; last_name: string }): string {
  return `${row.first_name} ${row.last_name}`.trim();
}

export function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}