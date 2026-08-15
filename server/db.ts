import Database from 'better-sqlite3';

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

const probabilityForStage = (stage: Stage): number => {
  switch (stage) {
    case 'new':
      return 20;
    case 'qualified':
      return 40;
    case 'proposal':
      return 60;
    case 'negotiation':
      return 80;
    case 'won':
      return 100;
    case 'lost':
      return 0;
  }
};

export class Db {
  private db: Database.Database;

  constructor(path: string) {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.migrate();
  }

  private migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        website TEXT,
        industry TEXT,
        notes TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        job_title TEXT,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'lead',
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
        stage TEXT NOT NULL DEFAULT 'new',
        value REAL NOT NULL DEFAULT 0,
        probability INTEGER NOT NULL DEFAULT 0,
        close_date TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        contact_id INTEGER REFERENCES contacts(id) ON DELETE CASCADE,
        deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
        description TEXT NOT NULL,
        happened_at TEXT NOT NULL,
        due_date TEXT,
        done INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);
      CREATE INDEX IF NOT EXISTS idx_deals_org ON deals(organization_id);
      CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
      CREATE INDEX IF NOT EXISTS idx_activities_contact ON activities(contact_id);
      CREATE INDEX IF NOT EXISTS idx_activities_deal ON activities(deal_id);
      CREATE INDEX IF NOT EXISTS idx_activities_due ON activities(due_date);
    `);
  }

  get isSeeded(): boolean {
    const row = this.db.prepare('SELECT COUNT(*) as n FROM organizations').get() as { n: number };
    return row.n > 0;
  }

  close() {
    this.db.close();
  }

  // Low-level helper for seed/test scripts: returns the inserted row id.
  run(sql: string, params: Array<string | number | null> = []): number {
    const res = this.db.prepare(sql).run(...params);
    return res.lastInsertRowid as number;
  }

  // ---------- Organizations ----------
  listOrganizations(search = ''): Array<Organization & { contact_count: number; deal_count: number }> {
    const q = `%${search}%`;
    const rows = this.db
      .prepare(
        `SELECT o.*,
          (SELECT COUNT(*) FROM contacts c WHERE c.organization_id = o.id) AS contact_count,
          (SELECT COUNT(*) FROM deals d WHERE d.organization_id = o.id) AS deal_count
         FROM organizations o
         WHERE (? = '%')
            OR o.name LIKE ? ESCAPE '\\'
            OR o.website LIKE ? ESCAPE '\\'
            OR o.industry LIKE ? ESCAPE '\\'
         ORDER BY o.name COLLATE NOCASE`
      )
      .all(q, q, q, q) as Array<Organization & { contact_count: number; deal_count: number }>;
    return rows;
  }

  getOrganization(id: number) {
    const org = this.db.prepare('SELECT * FROM organizations WHERE id = ?').get(id) as Organization | undefined;
    if (!org) return null;
    const contacts = this.db
      .prepare('SELECT * FROM contacts WHERE organization_id = ? ORDER BY last_name COLLATE NOCASE, first_name')
      .all(id) as Contact[];
    const deals = this.db
      .prepare('SELECT * FROM deals WHERE organization_id = ? ORDER BY created_at DESC')
      .all(id) as Deal[];
    return { ...org, contacts, deals };
  }

  createOrganization(input: Partial<Organization>) {
    const stmt = this.db.prepare(
      'INSERT INTO organizations (name, website, industry, notes, created_at) VALUES (?, ?, ?, ?, ?)'
    );
    const res = stmt.run(
      input.name ?? '',
      input.website ?? null,
      input.industry ?? null,
      input.notes ?? null,
      new Date().toISOString()
    );
    return this.getOrganization(res.lastInsertRowid as number);
  }

  updateOrganization(id: number, input: Partial<Organization>) {
    this.db
      .prepare('UPDATE organizations SET name = ?, website = ?, industry = ?, notes = ? WHERE id = ?')
      .run(input.name ?? '', input.website ?? null, input.industry ?? null, input.notes ?? null, id);
    return this.getOrganization(id);
  }

  deleteOrganization(id: number) {
    this.db.prepare('DELETE FROM organizations WHERE id = ?').run(id);
  }

  // ---------- Contacts ----------
  listContacts(filter: { search?: string; status?: string } = {}) {
    const q = `%${filter.search ?? ''}%`;
    const status = filter.status && filter.status !== 'all' ? filter.status : null;
    const rows = this.db
      .prepare(
        `SELECT c.*, o.name AS organization_name
         FROM contacts c
         LEFT JOIN organizations o ON o.id = c.organization_id
         WHERE (? = '%' OR c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\' OR c.email LIKE ? ESCAPE '\\')
           AND (? IS NULL OR c.status = ?)
         ORDER BY c.last_name COLLATE NOCASE, c.first_name`
      )
      .all(q, q, q, q, status, status) as Array<Contact & { organization_name: string | null }>;
    return rows;
  }

  getContact(id: number) {
    const row = this.db
      .prepare(
        `SELECT c.*, o.name AS organization_name, o.industry AS organization_industry
         FROM contacts c
         LEFT JOIN organizations o ON o.id = c.organization_id
         WHERE c.id = ?`
      )
      .get(id) as (Contact & { organization_name: string | null; organization_industry: string | null }) | undefined;
    if (!row) return null;
    const deals = this.db
      .prepare('SELECT * FROM deals WHERE contact_id = ? ORDER BY created_at DESC')
      .all(id) as Deal[];
    const activities = this.listActivities({ contactId: id });
    return { ...row, deals, activities };
  }

  createContact(input: Partial<Contact>) {
    const stmt = this.db.prepare(
      `INSERT INTO contacts (first_name, last_name, email, phone, job_title, organization_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const res = stmt.run(
      input.first_name ?? '',
      input.last_name ?? '',
      input.email ?? null,
      input.phone ?? null,
      input.job_title ?? null,
      input.organization_id ?? null,
      input.status ?? 'lead',
      new Date().toISOString()
    );
    return this.getContact(res.lastInsertRowid as number);
  }

  updateContact(id: number, input: Partial<Contact>) {
    this.db
      .prepare(
        `UPDATE contacts SET first_name = ?, last_name = ?, email = ?, phone = ?, job_title = ?, organization_id = ?, status = ?
         WHERE id = ?`
      )
      .run(
        input.first_name ?? '',
        input.last_name ?? '',
        input.email ?? null,
        input.phone ?? null,
        input.job_title ?? null,
        input.organization_id ?? null,
        input.status ?? 'lead',
        id
      );
    return this.getContact(id);
  }

  deleteContact(id: number) {
    this.db.prepare('DELETE FROM contacts WHERE id = ?').run(id);
  }

  // ---------- Deals ----------
  listDeals(filter: { search?: string } = {}) {
    const q = `%${filter.search ?? ''}%`;
    const rows = this.db
      .prepare(
        `SELECT d.*, o.name AS organization_name, c.first_name AS contact_first_name, c.last_name AS contact_last_name
         FROM deals d
         LEFT JOIN organizations o ON o.id = d.organization_id
         LEFT JOIN contacts c ON c.id = d.contact_id
         WHERE (? = '%' OR d.name LIKE ? ESCAPE '\\' OR o.name LIKE ? ESCAPE '\\' OR c.first_name LIKE ? ESCAPE '\\' OR c.last_name LIKE ? ESCAPE '\\')
         ORDER BY d.created_at DESC`
      )
      .all(q, q, q, q, q) as Array<
      Deal & { organization_name: string | null; contact_first_name: string | null; contact_last_name: string | null }
    >;
    return rows;
  }

  getDeal(id: number) {
    const row = this.db
      .prepare(
        `SELECT d.*, o.name AS organization_name, o.website AS organization_website,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name, c.email AS contact_email
         FROM deals d
         LEFT JOIN organizations o ON o.id = d.organization_id
         LEFT JOIN contacts c ON c.id = d.contact_id
         WHERE d.id = ?`
      )
      .get(id) as
      | (Deal & {
          organization_name: string | null;
          organization_website: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
          contact_email: string | null;
        })
      | undefined;
    if (!row) return null;
    const activities = this.listActivities({ dealId: id });
    return { ...row, activities };
  }

  createDeal(input: Partial<Deal>) {
    const stage: Stage = (input.stage as Stage) ?? 'new';
    const value = Number(input.value) || 0;
    const stmt = this.db.prepare(
      `INSERT INTO deals (name, organization_id, contact_id, stage, value, probability, close_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const res = stmt.run(
      input.name ?? '',
      input.organization_id ?? null,
      input.contact_id ?? null,
      stage,
      value,
      Number.isFinite(Number(input.probability)) ? Number(input.probability) : probabilityForStage(stage),
      input.close_date ?? null,
      new Date().toISOString()
    );
    return this.getDeal(res.lastInsertRowid as number);
  }

  updateDeal(id: number, input: Partial<Deal>) {
    const stage: Stage = (input.stage as Stage) ?? 'new';
    this.db
      .prepare(
        `UPDATE deals SET name = ?, organization_id = ?, contact_id = ?, stage = ?, value = ?, probability = ?, close_date = ?
         WHERE id = ?`
      )
      .run(
        input.name ?? '',
        input.organization_id ?? null,
        input.contact_id ?? null,
        stage,
        Number(input.value) || 0,
        Number.isFinite(Number(input.probability)) ? Number(input.probability) : probabilityForStage(stage),
        input.close_date ?? null,
        id
      );
    return this.getDeal(id);
  }

  setDealStage(id: number, stage: Stage) {
    this.db.prepare('UPDATE deals SET stage = ?, probability = ? WHERE id = ?').run(stage, probabilityForStage(stage), id);
    return this.getDeal(id);
  }

  deleteDeal(id: number) {
    this.db.prepare('DELETE FROM deals WHERE id = ?').run(id);
  }

  getPipeline() {
    return STAGES.map((stage) => {
      const deals = this.db
        .prepare(
          `SELECT d.*, o.name AS organization_name,
                  c.first_name AS contact_first_name, c.last_name AS contact_last_name
           FROM deals d
           LEFT JOIN organizations o ON o.id = d.organization_id
           LEFT JOIN contacts c ON c.id = d.contact_id
           WHERE d.stage = ?
           ORDER BY d.value DESC`
        )
        .all(stage) as Array<
        Deal & {
          organization_name: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
        }
      >;
      const totalValue = deals.reduce((s, d) => s + d.value, 0);
      const expectedRevenue = deals.reduce((s, d) => s + expectedRevenueFor(d), 0);
      return { stage, deals, totalValue, expectedRevenue, count: deals.length };
    });
  }

  // ---------- Activities ----------
  listActivities(filter: { contactId?: number; dealId?: number; limit?: number } = {}) {
    const where: string[] = [];
    const params: Array<string | number> = [];
    if (filter.contactId != null) {
      where.push('a.contact_id = ?');
      params.push(filter.contactId);
    }
    if (filter.dealId != null) {
      where.push('a.deal_id = ?');
      params.push(filter.dealId);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const limit = filter.limit ?? 200;
    const rows = this.db
      .prepare(
        `SELECT a.*,
                o.name AS organization_name,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name,
                d.name AS deal_name
         FROM activities a
         LEFT JOIN deals d ON d.id = a.deal_id
         LEFT JOIN contacts c ON c.id = a.contact_id
         LEFT JOIN organizations o ON o.id = d.organization_id
         ${whereSql}
         ORDER BY a.happened_at DESC, a.id DESC
         LIMIT ${limit}`
      )
      .all(...params) as Array<
      Activity & {
        organization_name: string | null;
        contact_first_name: string | null;
        contact_last_name: string | null;
        deal_name: string | null;
      }
    >;
    return rows;
  }

  createActivity(input: Partial<Activity>) {
    const stmt = this.db.prepare(
      `INSERT INTO activities (type, contact_id, deal_id, description, happened_at, due_date, done, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const happenedAt = (input.happened_at as string | null) ?? new Date().toISOString();
    const res = stmt.run(
      input.type ?? 'note',
      input.contact_id ?? null,
      input.deal_id ?? null,
      input.description ?? '',
      happenedAt,
      input.due_date ?? null,
      input.done ? 1 : 0,
      new Date().toISOString()
    );
    return this.getActivity(res.lastInsertRowid as number);
  }

  getActivity(id: number) {
    const row = this.db
      .prepare(
        `SELECT a.*,
                o.name AS organization_name,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name,
                d.name AS deal_name
         FROM activities a
         LEFT JOIN deals d ON d.id = a.deal_id
         LEFT JOIN contacts c ON c.id = a.contact_id
         LEFT JOIN organizations o ON o.id = d.organization_id
         WHERE a.id = ?`
      )
      .get(id) as
      | (Activity & {
          organization_name: string | null;
          contact_first_name: string | null;
          contact_last_name: string | null;
          deal_name: string | null;
        })
      | undefined;
    return row ?? null;
  }

  updateActivity(id: number, input: Partial<Activity>) {
    const current = this.db.prepare('SELECT * FROM activities WHERE id = ?').get(id) as Activity | undefined;
    if (!current) return null;
    this.db
      .prepare(
        `UPDATE activities SET type = ?, contact_id = ?, deal_id = ?, description = ?, due_date = ?, done = ?, happened_at = ?
         WHERE id = ?`
      )
      .run(
        input.type ?? current.type,
        input.contact_id !== undefined ? input.contact_id : current.contact_id,
        input.deal_id !== undefined ? input.deal_id : current.deal_id,
        input.description ?? current.description,
        input.due_date !== undefined ? input.due_date : current.due_date,
        input.done ? 1 : 0,
        input.happened_at ?? current.happened_at,
        id
      );
    return this.getActivity(id);
  }

  setActivityDone(id: number, done: boolean) {
    this.db.prepare('UPDATE activities SET done = ? WHERE id = ?').run(done ? 1 : 0, id);
    return this.getActivity(id);
  }

  deleteActivity(id: number) {
    this.db.prepare('DELETE FROM activities WHERE id = ?').run(id);
  }

  // ---------- Dashboard ----------
  getDashboard() {
    const deals = this.db.prepare('SELECT * FROM deals').all() as Deal[];
    const openDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const wonDeals = deals.filter((d) => d.stage === 'won');

    const pipelineValue = openDeals.reduce((s, d) => s + d.value, 0);
    const expectedRevenue = deals.reduce((s, d) => s + expectedRevenueFor(d), 0);
    const wonValue = wonDeals.reduce((s, d) => s + d.value, 0);

    const dealsWonPerMonth = monthSeries().map((m) => {
      const count = wonDeals.filter((d) => monthKey(d.close_date) === m.key).length;
      const revenue = wonDeals
        .filter((d) => monthKey(d.close_date) === m.key)
        .reduce((s, d) => s + d.value, 0);
      return { month: m.label, key: m.key, count, revenue };
    });

    const pipeline = this.getPipeline().map((p) => ({
      stage: p.stage,
      count: p.count,
      totalValue: p.totalValue,
      expectedRevenue: p.expectedRevenue
    }));

    const recentActivity = this.listActivities({ limit: 10 });

    const tasks = this.db
      .prepare(
        `SELECT a.id, a.type, a.description, a.due_date, a.done, a.happened_at,
                c.first_name AS contact_first_name, c.last_name AS contact_last_name,
                d.name AS deal_name, o.name AS organization_name
         FROM activities a
         LEFT JOIN deals d ON d.id = a.deal_id
         LEFT JOIN contacts c ON c.id = a.contact_id
         LEFT JOIN organizations o ON o.id = d.organization_id
         WHERE a.due_date IS NOT NULL AND a.done = 0
         ORDER BY a.due_date ASC`
      )
      .all() as Array<
      Activity & {
        contact_first_name: string | null;
        contact_last_name: string | null;
        deal_name: string | null;
        organization_name: string | null;
      }
    >;

    const today = todayKey();
    const overdue = tasks.filter((t) => (t.due_date as string) < today);
    const upcoming = tasks.filter((t) => (t.due_date as string) >= today);

    return {
      kpis: {
        pipelineValue,
        expectedRevenue,
        openDeals: openDeals.length,
        wonCount: wonDeals.length,
        wonValue,
        overdueTasks: overdue.length,
        upcomingTasks: upcoming.length
      },
      dealsWonPerMonth,
      pipeline,
      recentActivity,
      tasks: { overdue, upcoming }
    };
  }
}

export function expectedRevenueFor(d: { stage: Stage; value: number; probability: number }): number {
  if (d.stage === 'won') return d.value;
  if (d.stage === 'lost') return 0;
  return d.value * (d.probability / 100);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(date: string | null | undefined): string {
  if (!date) return '';
  return date.slice(0, 7);
}

function monthSeries(): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    out.push({ key, label });
  }
  return out;
}