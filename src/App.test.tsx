import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Organizations from './pages/Organizations';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Pipeline from './pages/Pipeline';
import ContactDetail from './pages/ContactDetail';
import Dashboard from './pages/Dashboard';
import { mockFetch, renderWithRouter, renderAt, orgs, contacts, deals, pipeline, dashboard, contactDetail, activity, getCalls } from './test/helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Organizations page', () => {
  it('renders the sample organizations in a table', async () => {
    mockFetch({ 'GET /api/organizations': () => orgs });
    renderWithRouter(<Organizations />);
    expect(await screen.findByText('Brightwave Analytics')).toBeInTheDocument();
    expect(screen.getByText('Meridian Logistics')).toBeInTheDocument();
    expect(screen.getByText('Data & Analytics')).toBeInTheDocument();
  });

  it('narrows the list as you type in the search box', async () => {
    mockFetch({ 'GET /api/organizations': () => orgs });
    const user = userEvent.setup();
    renderWithRouter(<Organizations />);
    await screen.findByText('Brightwave Analytics');

    await user.type(screen.getByLabelText('Search organizations'), 'bright');
    expect(screen.getByText('Brightwave Analytics')).toBeInTheDocument();
    expect(screen.queryByText('Meridian Logistics')).not.toBeInTheDocument();
  });

  it('posts a new organization when the add form is submitted', async () => {
    const list = [...orgs];
    const calls = mockFetch({
      'GET /api/organizations': () => [...list],
      'POST /api/organizations': (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const created = { ...body, id: 99, contact_count: 0, deal_count: 0, created_at: '2026-01-01T00:00:00Z' };
        list.push(created);
        return created;
      }
    });
    const user = userEvent.setup();
    renderWithRouter(<Organizations />);
    await screen.findByText('Brightwave Analytics');

    await user.click(screen.getAllByRole('button', { name: 'Add organization' })[0]);
    await user.type(screen.getByLabelText('Name *'), 'Acme Corp');
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Add organization' }));

    await waitFor(() => {
      expect(getCalls(calls).some((c) => c.method === 'POST')).toBe(true);
    });
    expect(await screen.findByText('Acme Corp')).toBeInTheDocument();
  });

  it('deletes an organization after confirming', async () => {
    const list = [...orgs];
    const calls = mockFetch({
      'GET /api/organizations': () => [...list],
      'DELETE /api/organizations/1': () => {
        list.splice(0, 1);
        return { ok: true };
      }
    });
    const user = userEvent.setup();
    renderWithRouter(<Organizations />);
    await screen.findByText('Brightwave Analytics');

    await user.click(screen.getByLabelText('Delete Brightwave Analytics'));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(getCalls(calls).some((c) => c.url.includes('/organizations/1') && c.method === 'DELETE')).toBe(true);
    });
    await waitFor(() => {
      expect(screen.queryByText('Brightwave Analytics')).not.toBeInTheDocument();
    });
  });
});

describe('Contacts page', () => {
  it('renders contacts and filters by status', async () => {
    mockFetch({ 'GET /api/contacts': () => contacts });
    const user = userEvent.setup();
    renderWithRouter(<Contacts />);
    await screen.findByText('Maya Chen');

    await user.click(screen.getByRole('button', { name: 'Qualified' }));
    expect(screen.getByText('Priya Nair')).toBeInTheDocument();
    expect(screen.queryByText('Maya Chen')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Customer' }));
    expect(screen.getByText('Maya Chen')).toBeInTheDocument();
    expect(screen.queryByText('Priya Nair')).not.toBeInTheDocument();
  });

  it('searches contacts by email', async () => {
    mockFetch({ 'GET /api/contacts': () => contacts });
    const user = userEvent.setup();
    renderWithRouter(<Contacts />);
    await screen.findByText('Maya Chen');

    await user.type(screen.getByLabelText('Search contacts'), 'liam.okafor@meridianlogistics.com');
    expect(screen.getByText('Liam Okafor')).toBeInTheDocument();
    expect(screen.queryByText('Maya Chen')).not.toBeInTheDocument();
  });
});

describe('Deals page', () => {
  it('renders deals with stage, value and organization', async () => {
    mockFetch({ 'GET /api/deals': () => deals, 'GET /api/organizations': () => orgs, 'GET /api/contacts': () => contacts });
    renderWithRouter(<Deals />);
    expect(await screen.findByText('Platform rollout')).toBeInTheDocument();
    expect(screen.getByText('Freight tracking upgrade')).toBeInTheDocument();
    expect(screen.getByText('$120,000')).toBeInTheDocument();
    expect(screen.getByText('Negotiation')).toBeInTheDocument();
  });

  it('searches deals by name', async () => {
    mockFetch({ 'GET /api/deals': () => deals, 'GET /api/organizations': () => orgs, 'GET /api/contacts': () => contacts });
    const user = userEvent.setup();
    renderWithRouter(<Deals />);
    await screen.findByText('Platform rollout');

    await user.type(screen.getByLabelText('Search deals'), 'freight');
    expect(screen.getByText('Freight tracking upgrade')).toBeInTheDocument();
    expect(screen.queryByText('Platform rollout')).not.toBeInTheDocument();
  });
});

describe('Pipeline board', () => {
  it('shows one column per stage with deals in the correct column', async () => {
    mockFetch({ 'GET /api/pipeline': () => pipeline, 'GET /api/organizations': () => orgs, 'GET /api/contacts': () => contacts });
    renderWithRouter(<Pipeline />);

    await screen.findByText('Platform rollout');
    for (const label of ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // deal values appear on their cards (also shown as column totals)
    expect(screen.getAllByText('$120,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$62,000').length).toBeGreaterThan(0);
    expect(screen.getAllByText('$9,000').length).toBeGreaterThan(0);
    // column totals and expected revenue render
    expect(screen.getAllByText('$96,000').length).toBeGreaterThan(0);
  });

  it('renders the empty state in columns with no deals', async () => {
    const emptyPipeline = pipeline.map((p) => ({ ...p, deals: [] }));
    mockFetch({ 'GET /api/pipeline': () => emptyPipeline, 'GET /api/organizations': () => orgs, 'GET /api/contacts': () => contacts });
    renderWithRouter(<Pipeline />);
    const dropZones = await screen.findAllByText('Drop deals here');
    expect(dropZones).toHaveLength(6);
  });
});

describe('Contact detail — activities', () => {
  it('adds an activity and shows it in the timeline', async () => {
    const actList = [...contactDetail.activities];
    const calls = mockFetch({
      'GET /api/contacts/1': () => ({ ...contactDetail, activities: [...actList] }),
      'GET /api/organizations': () => orgs,
      'POST /api/activities': (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const created = { ...activity, ...body, id: 999, description: body.description, type: body.type, due_date: body.due_date };
        actList.unshift(created);
        return created;
      }
    });
    const user = userEvent.setup();
    renderAt('/contacts/1', '/contacts/:id', <ContactDetail />);
    await screen.findByText('Wrote a quick note');

    await user.selectOptions(screen.getByLabelText('Type'), 'email');
    await user.type(screen.getByLabelText('What happened?'), 'Sent follow-up email');
    await user.click(screen.getByRole('button', { name: 'Log email' }));

    expect(await screen.findByText('Sent follow-up email')).toBeInTheDocument();
    expect(getCalls(calls).some((c) => c.method === 'POST' && c.url.includes('/activities'))).toBe(true);
  });

  it('toggles a task done and persists the change', async () => {
    const withTask = {
      ...contactDetail,
      activities: [
        { ...activity, id: 7, description: 'Send quote to Priya', due_date: '2026-08-01', done: 0 }
      ]
    };
    const calls = mockFetch({
      'GET /api/contacts/1': () => withTask,
      'GET /api/organizations': () => orgs,
      'PATCH /api/activities/7/done': (_url, init) => {
        const body = JSON.parse(String(init?.body));
        return { ...withTask.activities[0], done: body.done ? 1 : 0 };
      }
    });
    const user = userEvent.setup();
    renderAt('/contacts/1', '/contacts/:id', <ContactDetail />);
    await screen.findByText('Send quote to Priya');

    await user.click(screen.getByRole('button', { name: 'Mark as done' }));
    await waitFor(() => {
      expect(getCalls(calls).some((c) => c.method === 'PATCH' && c.url.includes('/done'))).toBe(true);
    });
  });
});

describe('Dashboard', () => {
  it('shows KPIs that match the underlying data', async () => {
    mockFetch({ 'GET /api/dashboard': () => dashboard });
    renderWithRouter(<Dashboard />);

    expect(await screen.findByText('$191,000')).toBeInTheDocument(); // pipeline value
    expect(screen.getByText('$135,000')).toBeInTheDocument(); // expected revenue
    expect(screen.getByText('7')).toBeInTheDocument(); // deals won
    expect(screen.getByText('3')).toBeInTheDocument(); // follow-ups count
  });

  it('lists overdue and upcoming tasks and marks one done', async () => {
    const state = structuredClone(dashboard);
    const calls = mockFetch({
      'GET /api/dashboard': () => state,
      'PATCH /api/activities/8/done': (_url, init) => {
        const body = JSON.parse(String(init?.body));
        const t = state.tasks.upcoming.find((x: { id: number }) => x.id === 8)!;
        t.done = body.done ? 1 : 0;
        return t;
      }
    });
    const user = userEvent.setup();
    renderWithRouter(<Dashboard />);

    await screen.findByText('Send quote to Priya');
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('Send contract to Maya')).toBeInTheDocument();
    expect(screen.getByText('Follow up on proposal')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Mark “Send contract to Maya” as done' }));
    await waitFor(() => {
      expect(getCalls(calls).some((c) => c.method === 'PATCH' && c.url.includes('/8/done'))).toBe(true);
    });
  });

  it('shows the recent activity feed', async () => {
    mockFetch({ 'GET /api/dashboard': () => dashboard });
    renderWithRouter(<Dashboard />);
    expect(await screen.findByText(/Walked through final pricing with Maya/)).toBeInTheDocument();
  });
});