import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

type Handler = (url: string, init?: RequestInit) => unknown;

// Mock global fetch routing on "METHOD /api/path".
export function mockFetch(routes: Record<string, Handler>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method ?? 'GET').toUpperCase();
      calls.push({ url, init });
      const key = `${method} ${new URL(url, 'http://localhost').pathname}`;
      const handler = routes[key];
      if (!handler) {
        return { ok: false, status: 404, json: async () => ({ error: `No mock for ${key}` }) } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => handler(url, init)
      } as Response;
    })
  );
  return calls;
}

export function renderWithRouter(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

// Renders a routed element so useParams works. `entry` is the URL to visit,
// `pattern` is the route pattern (e.g. '/contacts/:id').
export function renderAt(entry: string, pattern: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path={pattern} element={element} />
      </Routes>
    </MemoryRouter>
  );
}

export const getCalls = (calls: Array<{ url: string; init?: RequestInit }>) =>
  calls.map((c) => ({ url: c.url, method: c.init?.method ?? 'GET' }));

// Minimal, static API responses used across tests.
export const orgs = [
  { id: 1, name: 'Brightwave Analytics', website: 'brightwave.io', industry: 'Data & Analytics', notes: null, created_at: '2026-01-01T00:00:00Z', contact_count: 2, deal_count: 3 },
  { id: 2, name: 'Meridian Logistics', website: null, industry: 'Logistics', notes: null, created_at: '2026-01-01T00:00:00Z', contact_count: 1, deal_count: 1 }
];

export const contacts = [
  { id: 1, first_name: 'Maya', last_name: 'Chen', email: 'maya.chen@brightwave.io', phone: '+1 415 555 0134', job_title: 'VP Operations', organization_id: 1, organization_name: 'Brightwave Analytics', status: 'customer', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, first_name: 'Priya', last_name: 'Nair', email: 'p.nair@meridianlogistics.com', phone: null, job_title: 'Director of Operations', organization_id: 2, organization_name: 'Meridian Logistics', status: 'qualified', created_at: '2026-01-01T00:00:00Z' },
  { id: 3, first_name: 'Liam', last_name: 'Okafor', email: 'liam.okafor@meridianlogistics.com', phone: null, job_title: 'Finance Manager', organization_id: 2, organization_name: 'Meridian Logistics', status: 'lead', created_at: '2026-01-01T00:00:00Z' }
];

export const deals = [
  { id: 1, name: 'Platform rollout', organization_id: 1, contact_id: 1, organization_name: 'Brightwave Analytics', contact_first_name: 'Maya', contact_last_name: 'Chen', stage: 'negotiation', value: 120000, probability: 80, close_date: '2026-09-01', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, name: 'Freight tracking upgrade', organization_id: 2, contact_id: 2, organization_name: 'Meridian Logistics', contact_first_name: 'Priya', contact_last_name: 'Nair', stage: 'proposal', value: 62000, probability: 60, close_date: '2026-08-01', created_at: '2026-01-01T00:00:00Z' }
];

export const newDeal = {
  id: 3,
  name: 'Willow & Oak boutique plan',
  organization_id: null,
  contact_id: null,
  organization_name: null,
  contact_first_name: null,
  contact_last_name: null,
  stage: 'new',
  value: 9000,
  probability: 20,
  close_date: '2026-11-01',
  created_at: '2026-01-01T00:00:00Z'
} as const;

export const pipeline = [
  { stage: 'new', count: 1, totalValue: 9000, expectedRevenue: 1800, deals: [newDeal] },
  { stage: 'qualified', count: 0, totalValue: 0, expectedRevenue: 0, deals: [] },
  { stage: 'proposal', count: 1, totalValue: 62000, expectedRevenue: 37200, deals: [deals[1]] },
  { stage: 'negotiation', count: 1, totalValue: 120000, expectedRevenue: 96000, deals: [deals[0]] },
  { stage: 'won', count: 0, totalValue: 0, expectedRevenue: 0, deals: [] },
  { stage: 'lost', count: 0, totalValue: 0, expectedRevenue: 0, deals: [] }
];

export const dashboard = {
  kpis: { pipelineValue: 191000, expectedRevenue: 135000, openDeals: 3, wonCount: 7, wonValue: 278000, overdueTasks: 1, upcomingTasks: 2 },
  dealsWonPerMonth: [
    { month: 'Sep 25', key: '2025-09', count: 1, revenue: 51000 },
    { month: 'Oct 25', key: '2025-10', count: 1, revenue: 29000 },
    { month: 'Nov 25', key: '2025-11', count: 1, revenue: 47000 },
    { month: 'Dec 25', key: '2025-12', count: 0, revenue: 0 },
    { month: 'Jan 26', key: '2026-01', count: 0, revenue: 0 },
    { month: 'Feb 26', key: '2026-02', count: 1, revenue: 33000 },
    { month: 'Mar 26', key: '2026-03', count: 1, revenue: 58000 },
    { month: 'Apr 26', key: '2026-04', count: 1, revenue: 39000 },
    { month: 'May 26', key: '2026-05', count: 1, revenue: 21000 },
    { month: 'Jun 26', key: '2026-06', count: 0, revenue: 0 },
    { month: 'Jul 26', key: '2026-07', count: 0, revenue: 0 },
    { month: 'Aug 26', key: '2026-08', count: 0, revenue: 0 }
  ],
  pipeline: [
    { stage: 'new', count: 1, totalValue: 9000, expectedRevenue: 1800 },
    { stage: 'qualified', count: 0, totalValue: 0, expectedRevenue: 0 },
    { stage: 'proposal', count: 1, totalValue: 62000, expectedRevenue: 37200 },
    { stage: 'negotiation', count: 1, totalValue: 120000, expectedRevenue: 96000 },
    { stage: 'won', count: 7, totalValue: 278000, expectedRevenue: 278000 },
    { stage: 'lost', count: 1, totalValue: 14000, expectedRevenue: 0 }
  ],
  recentActivity: [
    { id: 10, type: 'call', contact_id: null, deal_id: 1, description: 'Walked through final pricing with Maya.', happened_at: '2026-08-15T10:00:00Z', due_date: null, done: 0, created_at: '2026-08-15T10:00:00Z', organization_name: 'Brightwave Analytics', contact_first_name: null, contact_last_name: null, deal_name: 'Platform rollout' }
  ],
  tasks: {
    overdue: [
      { id: 7, type: 'note', contact_id: 2, deal_id: null, description: 'Send quote to Priya', happened_at: '2026-08-10T09:00:00Z', due_date: '2026-08-01', done: 0, created_at: '2026-08-10T09:00:00Z', organization_name: 'Meridian Logistics', contact_first_name: 'Priya', contact_last_name: 'Nair', deal_name: null }
    ],
    upcoming: [
      { id: 8, type: 'email', contact_id: 1, deal_id: null, description: 'Send contract to Maya', happened_at: '2026-08-12T09:00:00Z', due_date: '2026-08-20', done: 0, created_at: '2026-08-12T09:00:00Z', organization_name: 'Brightwave Analytics', contact_first_name: 'Maya', contact_last_name: 'Chen', deal_name: null },
      { id: 9, type: 'call', contact_id: null, deal_id: 2, description: 'Follow up on proposal', happened_at: '2026-08-13T09:00:00Z', due_date: '2026-08-22', done: 0, created_at: '2026-08-13T09:00:00Z', organization_name: 'Meridian Logistics', contact_first_name: null, contact_last_name: null, deal_name: 'Freight tracking upgrade' }
    ]
  }
};

export const activity = {
  id: 11,
  type: 'note',
  contact_id: 1,
  deal_id: null,
  description: 'Wrote a quick note',
  happened_at: '2026-08-15T11:00:00Z',
  due_date: null,
  done: 0,
  created_at: '2026-08-15T11:00:00Z',
  organization_name: 'Brightwave Analytics',
  contact_first_name: 'Maya',
  contact_last_name: 'Chen',
  deal_name: null
};

export const contactDetail = {
  ...contacts[0],
  organization_industry: 'Data & Analytics',
  deals: [deals[0]],
  activities: [activity]
};