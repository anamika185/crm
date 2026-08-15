export const STAGES = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const;
export type Stage = (typeof STAGES)[number];

export const CONTACT_STATUSES = ['lead', 'qualified', 'customer'] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const ACTIVITY_TYPES = ['note', 'call', 'email'] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export interface Organization {
  id: number;
  name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

export interface OrganizationRow extends Organization {
  contact_count: number;
  deal_count: number;
}

export interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  job_title: string | null;
  organization_id: number | null;
  status: ContactStatus;
  created_at: string;
}

export interface ContactRow extends Contact {
  organization_name: string | null;
}

export interface ContactDetail extends ContactRow {
  organization_industry: string | null;
  deals: Deal[];
  activities: ActivityRow[];
}

export interface Deal {
  id: number;
  name: string;
  organization_id: number | null;
  contact_id: number | null;
  stage: Stage;
  value: number;
  probability: number;
  close_date: string | null;
  created_at: string;
}

export interface DealRow extends Deal {
  organization_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
}

export interface DealDetail extends DealRow {
  organization_website: string | null;
  contact_email: string | null;
  activities: ActivityRow[];
}

export interface Activity {
  id: number;
  type: ActivityType;
  contact_id: number | null;
  deal_id: number | null;
  description: string;
  happened_at: string;
  due_date: string | null;
  done: number;
  created_at: string;
}

export interface ActivityRow extends Activity {
  organization_name: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  deal_name: string | null;
}

export interface PipelineColumn {
  stage: Stage;
  count: number;
  totalValue: number;
  expectedRevenue: number;
  deals: Array<DealRow>;
}

export interface DashboardData {
  kpis: {
    pipelineValue: number;
    expectedRevenue: number;
    openDeals: number;
    wonCount: number;
    wonValue: number;
    overdueTasks: number;
    upcomingTasks: number;
  };
  dealsWonPerMonth: Array<{ month: string; key: string; count: number; revenue: number }>;
  pipeline: Array<{ stage: Stage; count: number; totalValue: number; expectedRevenue: number }>;
  recentActivity: ActivityRow[];
  tasks: {
    overdue: ActivityRow[];
    upcoming: ActivityRow[];
  };
}