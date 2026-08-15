import type {
  ContactRow,
  DashboardData,
  DealDetail,
  DealRow,
  ContactDetail,
  Organization,
  OrganizationRow,
  PipelineColumn,
  Stage
} from './types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const qs = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) search.set(k, v);
  });
  const s = search.toString();
  return s ? `?${s}` : '';
};

export const api = {
  // Organizations
  listOrganizations: (q = '') => request<OrganizationRow[]>(`/organizations${qs({ q })}`),
  getOrganization: (id: number) =>
    request<Organization & { contacts: ContactRow[]; deals: DealRow[] }>(`/organizations/${id}`),
  createOrganization: (data: Partial<Organization>) => request<Organization>('/organizations', { method: 'POST', body: JSON.stringify(data) }),
  updateOrganization: (id: number, data: Partial<Organization>) =>
    request<Organization>(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOrganization: (id: number) => request<{ ok: boolean }>(`/organizations/${id}`, { method: 'DELETE' }),

  // Contacts
  listContacts: (q = '', status = '') => request<ContactRow[]>(`/contacts${qs({ q, status })}`),
  getContact: (id: number) => request<ContactDetail>(`/contacts/${id}`),
  createContact: (data: Partial<ContactRow>) => request<ContactRow>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: (id: number, data: Partial<ContactRow>) =>
    request<ContactRow>(`/contacts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: (id: number) => request<{ ok: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),

  // Deals
  listDeals: (q = '') => request<DealRow[]>(`/deals${qs({ q })}`),
  getDeal: (id: number) => request<DealDetail>(`/deals/${id}`),
  createDeal: (data: Partial<DealRow>) => request<DealRow>('/deals', { method: 'POST', body: JSON.stringify(data) }),
  updateDeal: (id: number, data: Partial<DealRow>) =>
    request<DealRow>(`/deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  setDealStage: (id: number, stage: Stage) =>
    request<DealRow>(`/deals/${id}/stage`, { method: 'PATCH', body: JSON.stringify({ stage }) }),
  deleteDeal: (id: number) => request<{ ok: boolean }>(`/deals/${id}`, { method: 'DELETE' }),
  getPipeline: () => request<PipelineColumn[]>('/pipeline'),

  // Activities
  createActivity: (data: Partial<import('./types').Activity>) =>
    request<import('./types').ActivityRow>('/activities', { method: 'POST', body: JSON.stringify(data) }),
  updateActivity: (id: number, data: Partial<import('./types').Activity>) =>
    request<import('./types').ActivityRow>(`/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  setActivityDone: (id: number, done: boolean) =>
    request<import('./types').ActivityRow>(`/activities/${id}/done`, { method: 'PATCH', body: JSON.stringify({ done }) }),
  deleteActivity: (id: number) => request<{ ok: boolean }>(`/activities/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: () => request<DashboardData>('/dashboard')
};