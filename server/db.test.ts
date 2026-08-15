import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Db } from './db.js';
import type { Activity, Organization, Contact, Deal } from './db.js';
import { seed } from './seed.js';

let db: Db;
let dir: string;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'crm-test-'));
  db = new Db(path.join(dir, 'test.sqlite'));
});

afterEach(() => {
  db.close();
  fs.rmSync(dir, { recursive: true, force: true });
});

const org = (name: string, overrides: Partial<Organization> = {}): Partial<Organization> => ({ name, website: null, industry: null, notes: null, ...overrides });

describe('organizations CRUD', () => {
  it('creates and reads an organization', () => {
    const created = db.createOrganization(org('Acme Corp', { website: 'acme.com', industry: 'Manufacturing' }))!;
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe('Acme Corp');
    expect(created.industry).toBe('Manufacturing');

    const found = db.getOrganization(created.id);
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Acme Corp');
  });

  it('updates an organization', () => {
    const created = db.createOrganization(org('Acme'))!;
    const updated = db.updateOrganization(created.id, org('Acme Corporation', { industry: 'Tech' }));
    expect(updated!.name).toBe('Acme Corporation');
    expect(updated!.industry).toBe('Tech');
  });

  it('deletes an organization', () => {
    const created = db.createOrganization(org('Acme'))!;
    db.deleteOrganization(created.id);
    expect(db.getOrganization(created.id)).toBeNull();
    expect(db.listOrganizations()).toHaveLength(0);
  });

  it('searches organizations by name, website and industry', () => {
    db.createOrganization(org('Brightwave Analytics', { website: 'brightwave.io', industry: 'Data' }));
    db.createOrganization(org('Meridian Logistics', { industry: 'Logistics' }));
    expect(db.listOrganizations('bright')).toHaveLength(1);
    expect(db.listOrganizations('brightwave')).toHaveLength(1);
    expect(db.listOrganizations('logistics')).toHaveLength(1);
    expect(db.listOrganizations('zzz')).toHaveLength(0);
  });
});

describe('contacts CRUD', () => {
  const base = (overrides: Partial<Contact> = {}): Partial<Contact> => ({
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: null,
    job_title: 'Engineer',
    organization_id: null,
    status: 'lead',
    ...overrides
  });

  it('creates and reads a contact', () => {
    const created = db.createContact(base({ status: 'qualified' }))!;
    expect(created.id).toBeGreaterThan(0);
    expect(created.first_name).toBe('Jane');
    expect(created.status).toBe('qualified');
    const found = db.getContact(created.id);
    expect(found!.last_name).toBe('Doe');
  });

  it('updates a contact', () => {
    const created = db.createContact(base())!;
    const updated = db.updateContact(created.id, base({ first_name: 'Janet', status: 'customer' }));
    expect(updated!.first_name).toBe('Janet');
    expect(updated!.status).toBe('customer');
  });

  it('deletes a contact', () => {
    const created = db.createContact(base())!;
    db.deleteContact(created.id);
    expect(db.getContact(created.id)).toBeNull();
  });

  it('searches contacts by name and email, and filters by status', () => {
    db.createContact(base({ first_name: 'Priya', last_name: 'Nair', email: 'priya@x.com', status: 'qualified' }));
    db.createContact(base({ first_name: 'Liam', last_name: 'Okafor', email: 'liam@y.com', status: 'lead' }));
    expect(db.listContacts({ search: 'priya' })).toHaveLength(1);
    expect(db.listContacts({ search: 'okaf' })).toHaveLength(1);
    expect(db.listContacts({ search: 'priya@x.com' })).toHaveLength(1);
    expect(db.listContacts({ status: 'lead' })).toHaveLength(1);
    expect(db.listContacts({ status: 'customer' })).toHaveLength(0);
  });

  it('links a contact to its organization', () => {
    const o = db.createOrganization(org('Acme'))!;
    const c = db.createContact(base({ organization_id: o.id }))!;
    const detail = db.getContact(c.id);
    expect(detail!.organization_name).toBe('Acme');
  });
});

describe('deals CRUD', () => {
  const base = (overrides: Partial<Deal> = {}): Partial<Deal> => ({
    name: 'Big deal',
    organization_id: null,
    contact_id: null,
    stage: 'new',
    value: 50000,
    close_date: null,
    ...overrides
  });

  it('creates and reads a deal', () => {
    const created = db.createDeal(base({ stage: 'proposal', value: 75000 }))!;
    expect(created.id).toBeGreaterThan(0);
    expect(created.stage).toBe('proposal');
    expect(created.probability).toBe(60);
    const found = db.getDeal(created.id);
    expect(found!.value).toBe(75000);
  });

  it('updates a deal', () => {
    const created = db.createDeal(base())!;
    const updated = db.updateDeal(created.id, base({ name: 'Bigger deal', value: 90000 }));
    expect(updated!.name).toBe('Bigger deal');
    expect(updated!.value).toBe(90000);
  });

  it('deletes a deal', () => {
    const created = db.createDeal(base())!;
    db.deleteDeal(created.id);
    expect(db.getDeal(created.id)).toBeNull();
  });

  it('searches deals by name and organization', () => {
    const o = db.createOrganization(org('Brightwave'))!;
    db.createDeal(base({ name: 'Platform rollout', organization_id: o.id }));
    db.createDeal(base({ name: 'Data add-on' }));
    expect(db.listDeals({ search: 'platform' })).toHaveLength(1);
    expect(db.listDeals({ search: 'brightwave' })).toHaveLength(1);
    expect(db.listDeals({ search: 'zzz' })).toHaveLength(0);
  });

  it('assigns default probability per stage', () => {
    const newDeal = db.createDeal(base({ stage: 'new' }));
    const neg = db.createDeal(base({ stage: 'negotiation' }));
    expect(newDeal!.probability).toBe(20);
    expect(neg!.probability).toBe(80);
  });
});

describe('deal stage changes', () => {
  it('changes stage to won and back', () => {
    const deal = db.createDeal({ name: 'Test', stage: 'new', value: 1000 })!;
    const won = db.setDealStage(deal.id, 'won');
    expect(won!.stage).toBe('won');
    expect(won!.probability).toBe(100);

    const lost = db.setDealStage(deal.id, 'lost');
    expect(lost!.stage).toBe('lost');
    expect(lost!.probability).toBe(0);

    const back = db.setDealStage(deal.id, 'qualified');
    expect(back!.stage).toBe('qualified');
    expect(back!.probability).toBe(40);
  });

  it('reflects stage changes in the pipeline grouping', () => {
    const deal = db.createDeal({ name: 'Moving deal', stage: 'new', value: 2000 })!;
    let pipeline = db.getPipeline();
    expect(pipeline.find((p) => p.stage === 'new')!.count).toBe(1);

    db.setDealStage(deal.id, 'won');
    pipeline = db.getPipeline();
    expect(pipeline.find((p) => p.stage === 'new')!.count).toBe(0);
    const wonCol = pipeline.find((p) => p.stage === 'won')!;
    expect(wonCol.count).toBe(1);
    expect(wonCol.totalValue).toBe(2000);
    expect(wonCol.expectedRevenue).toBe(2000);
  });
});

describe('activities', () => {
  const base = (overrides: Partial<Activity> = {}): Partial<Activity> => ({
    type: 'note',
    contact_id: null,
    deal_id: null,
    description: 'Talked to the team',
    due_date: null,
    done: 0,
    ...overrides
  });

  it('creates and reads an activity', () => {
    const created = db.createActivity(base({ type: 'call', description: 'Call went well' }))!;
    expect(created.id).toBeGreaterThan(0);
    expect(created.type).toBe('call');
    expect(db.getActivity(created.id)!.description).toBe('Call went well');
  });

  it('updates an activity', () => {
    const created = db.createActivity(base())!;
    const updated = db.updateActivity(created.id, { description: 'Updated notes' });
    expect(updated!.description).toBe('Updated notes');
  });

  it('deletes an activity', () => {
    const created = db.createActivity(base())!;
    db.deleteActivity(created.id);
    expect(db.getActivity(created.id)).toBeNull();
  });

  it('toggles task completion', () => {
    const created = db.createActivity(base({ due_date: '2026-01-15' }))!;
    expect(created.done).toBe(0);
    db.setActivityDone(created.id, true);
    expect(db.getActivity(created.id)!.done).toBe(1);
    db.setActivityDone(created.id, false);
    expect(db.getActivity(created.id)!.done).toBe(0);
  });

  it('lists activities newest first and scoped to a contact or deal', () => {
    const c = db.createContact({ first_name: 'A', last_name: 'B' })!;
    const d = db.createDeal({ name: 'Deal', value: 1 })!;
    db.createActivity(base({ description: 'oldest', contact_id: c.id, happened_at: '2026-01-01T00:00:00Z' }));
    db.createActivity(base({ description: 'newest', contact_id: c.id, happened_at: '2026-02-01T00:00:00Z' }));
    db.createActivity(base({ description: 'deal act', deal_id: d.id, happened_at: '2026-03-01T00:00:00Z' }));

    const forContact = db.listActivities({ contactId: c.id });
    expect(forContact.map((a) => a.description)).toEqual(['newest', 'oldest']);

    const forDeal = db.listActivities({ dealId: d.id });
    expect(forDeal).toHaveLength(1);
    expect(forDeal[0].description).toBe('deal act');
  });
});

describe('dashboard', () => {
  it('aggregates won deals and revenue by month', () => {
    db.createDeal({ name: 'Won Jan', stage: 'won', value: 1000, close_date: `${new Date().getFullYear()}-01-15` });
    db.createDeal({ name: 'Won Jan 2', stage: 'won', value: 2000, close_date: `${new Date().getFullYear()}-01-20` });
    db.createDeal({ name: 'Open', stage: 'proposal', value: 5000, probability: 60, close_date: null });

    const dash = db.getDashboard();
    const jan = dash.dealsWonPerMonth.find((m) => m.month.includes('Jan'));
    expect(jan!.count).toBe(2);
    expect(jan!.revenue).toBe(3000);
    expect(dash.kpis.wonCount).toBe(2);
    expect(dash.kpis.wonValue).toBe(3000);
  });

  it('computes expected revenue from probability (open) and value (won)', () => {
    db.createDeal({ name: 'A', stage: 'new', value: 1000, probability: 50 });
    db.createDeal({ name: 'B', stage: 'won', value: 4000, probability: 100 });
    db.createDeal({ name: 'C', stage: 'lost', value: 9000, probability: 0 });

    const dash = db.getDashboard();
    expect(dash.kpis.pipelineValue).toBe(1000);
    expect(dash.kpis.expectedRevenue).toBe(500 + 4000);
    expect(dash.kpis.openDeals).toBe(1);
  });

  it('splits tasks into overdue and upcoming', () => {
    const past = '2000-01-01';
    const future = '2999-01-01';
    db.createActivity({ type: 'note', description: 'overdue task', due_date: past, done: 0 });
    db.createActivity({ type: 'note', description: 'upcoming task', due_date: future, done: 0 });
    db.createActivity({ type: 'note', description: 'done task', due_date: past, done: 1 });
    db.createActivity({ type: 'note', description: 'no due date', done: 0 });

    const dash = db.getDashboard();
    expect(dash.tasks.overdue.map((t) => t.description)).toEqual(['overdue task']);
    expect(dash.tasks.upcoming.map((t) => t.description)).toEqual(['upcoming task']);
    expect(dash.kpis.overdueTasks).toBe(1);
    expect(dash.kpis.upcomingTasks).toBe(1);
  });

  it('lists recent activity with joined names', () => {
    db.createActivity({ type: 'email', description: 'Email sent', happened_at: new Date().toISOString() });
    const dash = db.getDashboard();
    expect(dash.recentActivity.length).toBeGreaterThan(0);
    expect(dash.recentActivity[0].type).toBe('email');
  });
});

describe('seed data', () => {
  it('populates all four record types realistically', () => {
    seed(db);
    expect(db.listOrganizations().length).toBeGreaterThanOrEqual(5);
    expect(db.listContacts().length).toBeGreaterThanOrEqual(5);
    expect(db.listDeals().length).toBeGreaterThanOrEqual(10);

    const pipeline = db.getPipeline();
    for (const stage of ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const) {
      expect(pipeline.find((p) => p.stage === stage)!.count).toBeGreaterThan(0);
    }

    const dash = db.getDashboard();
    expect(dash.recentActivity.length).toBeGreaterThan(0);
    expect(dash.tasks.overdue.length).toBeGreaterThan(0);
    expect(dash.tasks.upcoming.length).toBeGreaterThan(0);
    // won deals spread across at least 3 months for meaningful charts
    expect(dash.dealsWonPerMonth.filter((m) => m.count > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('does not reseed an already-seeded database', () => {
    seed(db);
    seed(db);
    expect(db.listOrganizations().length).toBe(8);
  });
});