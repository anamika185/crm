import type { Db, Stage, ContactStatus, ActivityType } from './db.js';

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(n: number, hour = 0): string {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function monthsAgoDate(n: number, day = 1): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return d.toISOString().slice(0, 10);
}

function daysFromNowDate(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString().slice(0, 10);
}

function daysFromNow(n: number): string {
  return new Date(Date.now() + n * DAY).toISOString();
}

function daysAgoDate(n: number): string {
  return new Date(Date.now() - n * DAY).toISOString().slice(0, 10);
}

export function seed(db: Db) {
  if (db.isSeeded) return;

  const now = new Date().toISOString();

  const orgs: Array<[string, string, string, string]> = [
    ['Brightwave Analytics', 'brightwave.io', 'Data & Analytics', 'Series B SaaS helping retail teams forecast demand. Warm referral from Maya.'],
    ['Meridian Logistics', 'meridianlogistics.com', 'Logistics', 'Mid-sized freight forwarder with a growing tech budget.'],
    ['Pinnacle Health', 'pinnaclehealth.org', 'Healthcare', 'Regional health network with several affiliated clinics.'],
    ['Vertex Robotics', 'vertexrobotics.com', 'Robotics', 'Boutique robotics firm. Key technical contact is Omar.'],
    ['Harborline Foods', 'harborlinefoods.com', 'Food & Beverage', 'National distributor evaluating our platform for their supply chain.'],
    ['Nimbus Cloud Systems', 'nimbuscloud.dev', 'Cloud Infrastructure', 'Fast-growing startup, still early in our conversations.'],
    ['Crescent Capital', 'crescentcap.com', 'Finance', 'Asset management firm — referral through their CTO.'],
    ['Willow & Oak Interiors', 'willowoakinteriors.com', 'Retail', 'Boutique furniture retailer, smaller opportunity but quick to close.']
  ];

  const orgIds = orgs.map(([name, website, industry, notes]) => {
    const res = db.run(
      `INSERT INTO organizations (name, website, industry, notes, created_at) VALUES (?, ?, ?, ?, ?)`,
      [name, website, industry, notes, now]
    );
    return Number(res);
  });

  type ContactSeed = [string, string, string | null, string | null, string | null, number, ContactStatus];
  const contacts: ContactSeed[] = [
    ['Maya', 'Chen', 'maya.chen@brightwave.io', '+1 415 555 0134', 'VP Operations', orgIds[0], 'customer'],
    ['Diego', 'Ramirez', 'diego.r@brightwave.io', '+1 415 555 0177', 'Head of Data', orgIds[0], 'customer'],
    ['Priya', 'Nair', 'p.nair@meridianlogistics.com', '+1 312 555 0192', 'Director of Operations', orgIds[1], 'qualified'],
    ['Liam', 'Okafor', 'liam.okafor@meridianlogistics.com', '+1 312 555 0110', 'Finance Manager', orgIds[1], 'lead'],
    ['Sarah', 'Whitfield', 'sarah.w@pinnaclehealth.org', '+1 720 555 0148', 'CIO', orgIds[2], 'qualified'],
    ['Omar', 'Haddad', 'omar@vertexrobotics.com', '+1 206 555 0161', 'Head of Engineering', orgIds[3], 'customer'],
    ['Elena', 'Vasquez', 'elena.v@harborlinefoods.com', '+1 917 555 0122', 'Supply Chain Director', orgIds[4], 'qualified'],
    ['Tom', 'Brennan', 'tom@harborlinefoods.com', '+1 917 555 0133', 'Procurement Lead', orgIds[4], 'lead'],
    ['Aisha', 'Khan', 'aisha@nimbuscloud.dev', '+1 510 555 0150', 'Founder', orgIds[5], 'lead'],
    ['Grace', 'Fischer', 'g.fischer@crescentcap.com', '+1 646 555 0189', 'CTO', orgIds[6], 'qualified'],
    ['Nina', 'Soto', 'nina@willowoakinteriors.com', '+1 503 555 0104', 'Owner', orgIds[7], 'lead'],
    ['Robert', 'Michaels', 'r.michaels@brightwave.io', '+1 415 555 0119', 'CFO', orgIds[0], 'customer']
  ];

  const contactIds = contacts.map(([first, last, email, phone, title, orgId, status]) => {
    const res = db.run(
      `INSERT INTO contacts (first_name, last_name, email, phone, job_title, organization_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [first, last, email, phone, title, orgId, status, now]
    );
    return Number(res);
  });

  type DealSeed = [string, number, number, Stage, number, number, string];
  const deals: DealSeed[] = [
    // Open deals across stages
    ['Brightwave Analytics platform rollout', 0, 0, 'negotiation', 120000, 80, daysFromNowDate(18)],
    ['Brightwave data warehousing add-on', 0, 1, 'proposal', 45000, 60, daysFromNowDate(40)],
    ['Meridian freight tracking upgrade', 1, 2, 'proposal', 62000, 60, daysFromNowDate(35)],
    ['Meridian annual maintenance renewal', 1, 3, 'qualified', 18000, 40, daysFromNowDate(70)],
    ['Pinnacle Health network rollout', 2, 4, 'negotiation', 95000, 80, daysFromNowDate(12)],
    ['Vertex robotics integration license', 3, 5, 'qualified', 38000, 40, daysFromNowDate(55)],
    ['Harborline supply chain suite', 4, 6, 'proposal', 74000, 60, daysFromNowDate(28)],
    ['Harborline pilot evaluation', 4, 7, 'new', 15000, 20, daysFromNowDate(90)],
    ['Nimbus Cloud early-stage partnership', 5, 8, 'new', 25000, 20, daysFromNowDate(75)],
    ['Crescent Capital compliance portal', 6, 9, 'qualified', 88000, 40, daysFromNowDate(48)],
    ['Willow & Oak boutique plan', 7, 10, 'new', 9000, 20, daysFromNowDate(110)],
    ['Brightwave CFO reporting module', 0, 11, 'proposal', 36000, 60, daysFromNowDate(22)],
    // Won deals — spread over the last ~8 months for the dashboard charts
    ['Vertex robotics core license', 3, 5, 'won', 51000, 100, monthsAgoDate(8, 14)],
    ['Pinnacle Health pilot', 2, 4, 'won', 29000, 100, monthsAgoDate(7, 3)],
    ['Brightwave analytics starter', 0, 0, 'won', 47000, 100, monthsAgoDate(6, 22)],
    ['Meridian freight basic tracking', 1, 2, 'won', 33000, 100, monthsAgoDate(4, 9)],
    ['Crescent Capital risk dashboard', 6, 9, 'won', 58000, 100, monthsAgoDate(3, 17)],
    ['Brightwave renewal (annual)', 0, 0, 'won', 39000, 100, monthsAgoDate(2, 6)],
    ['Pinnacle Health clinic add-on', 2, 4, 'won', 21000, 100, monthsAgoDate(1, 25)],
    // Lost deal
    ['Willow & Oak pro suite', 7, 10, 'lost', 14000, 0, monthsAgoDate(2, 28)]
  ];

  const dealIds = deals.map(([name, orgIdx, contactIdx, stage, value, probability, closeDate]) => {
    const res = db.run(
      `INSERT INTO deals (name, organization_id, contact_id, stage, value, probability, close_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, orgIds[orgIdx], contactIds[contactIdx], stage, value, probability, closeDate, daysAgo(5)]
    );
    return Number(res);
  });

  type ActivitySeed = [ActivityType, number | null, number | null, string, string, string | null, boolean];
  // second field = contact index (nullable), third = deal index (nullable)
  const activities: ActivitySeed[] = [
    ['call', null, 0, 'Walked through final pricing with Maya. She wants board approval by end of quarter.', daysAgo(0, 10), null, false],
    ['email', 0, null, 'Sent the updated contract with the revised support scope for the platform rollout.', daysAgo(1, 15), daysFromNow(5), false],
    ['note', 4, null, 'Sarah confirmed Pinnacle can move forward pending legal review of the data agreement.', daysAgo(1, 12), null, false],
    ['call', 2, null, 'Discussed freight tracking requirements with Priya. Follow up with a proposal draft.', daysAgo(2, 16), daysFromNow(2), false],
    ['email', 5, null, 'Omar approved the integration timeline. Kicking off technical scoping next week.', daysAgo(2, 11), null, false],
    ['note', null, 9, 'Elaborated pricing sheet for the Crescent Capital compliance portal.', daysAgo(3, 9), daysFromNow(9), false],
    ['call', 8, null, 'First discovery call with Aisha at Nimbus — small team, moving fast. Budget is flexible.', daysAgo(4, 14), null, false],
    ['note', null, 7, 'Harborline wants a pilot before committing to the full suite.', daysAgo(4, 9), daysAgoDate(1), true],
    ['email', 10, null, 'Sent boutique plan overview to Nina. She mentioned budget approval needed from her partner.', daysAgo(5, 10), null, false],
    ['call', 3, null, 'Left voicemail for Liam about the maintenance renewal dates — chase for a callback.', daysAgo(6, 10), daysAgoDate(2), false],
    ['email', 6, null, 'Elena asked for updated volume pricing — promised a quote, still owed.', daysAgo(3, 16), daysAgoDate(3), false],
    ['note', null, 4, 'Pinnacle pilot metrics looked strong — recommending we push for the full network rollout.', daysAgo(7, 9), daysFromNow(1), false],
    ['email', 1, null, 'Shared reference case study with Diego for the data warehousing add-on.', daysAgo(8, 15), null, false],
    ['note', null, 7, 'Prepared pilot evaluation scope for Harborline.', daysAgo(9, 12), daysFromNow(6), false],
    ['call', 6, null, 'Follow-up call with Elena — very positive, wants a demo for her team next week.', daysAgo(10, 10), daysFromNow(3), false],
    ['note', 11, null, 'Robert asked for a forecast of quarterly reporting costs.', daysAgo(11, 9), null, false]
  ];

  activities.forEach(([type, contactIdx, dealIdx, description, happenedAt, dueDate, done]) => {
    db.run(
      `INSERT INTO activities (type, contact_id, deal_id, description, happened_at, due_date, done, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        contactIdx != null ? contactIds[contactIdx] : null,
        dealIdx != null ? dealIds[dealIdx] : null,
        description,
        happenedAt,
        dueDate,
        done ? 1 : 0,
        happenedAt
      ]
    );
  });
}