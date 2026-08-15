import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import type { ContactStatus, Stage } from '../types';
import { CONTACT_STATUSES, STAGES } from '../types';
import type { ContactRow, Organization, DealRow } from '../types';
import { STAGE_LABELS } from '../utils';

// ---------- Organization ----------
export interface OrgFormValues {
  name: string;
  website: string;
  industry: string;
  notes: string;
}

export function OrganizationForm({
  initial,
  onSave,
  onClose
}: {
  initial?: Partial<Organization>;
  onSave: (values: OrgFormValues) => Promise<void> | void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<OrgFormValues>({
    name: initial?.name ?? '',
    website: initial?.website ?? '',
    industry: initial?.industry ?? '',
    notes: initial?.notes ?? ''
  });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof OrgFormValues) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setBusy(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit organization' : 'Add organization'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <div className="field full">
          <label htmlFor="org-name">Name *</label>
          <input id="org-name" value={values.name} onChange={set('name')} autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="org-website">Website</label>
          <input id="org-website" value={values.website} onChange={set('website')} placeholder="example.com" />
        </div>
        <div className="field">
          <label htmlFor="org-industry">Industry</label>
          <input id="org-industry" value={values.industry} onChange={set('industry')} />
        </div>
        <div className="field full">
          <label htmlFor="org-notes">Notes</label>
          <textarea id="org-notes" value={values.notes} onChange={set('notes')} />
        </div>
        <div className="full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !values.name.trim()}>
            {initial ? 'Save changes' : 'Add organization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Contact ----------
export interface ContactFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  job_title: string;
  organization_id: number | '';
  status: ContactStatus;
}

export function ContactForm({
  initial,
  organizations,
  onSave,
  onClose
}: {
  initial?: Partial<ContactRow>;
  organizations: Organization[];
  onSave: (values: ContactFormValues) => Promise<void> | void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<ContactFormValues>({
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    job_title: initial?.job_title ?? '',
    organization_id: initial?.organization_id ?? '',
    status: initial?.status ?? 'lead'
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ContactFormValues>(key: K) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setValues((v) => ({
      ...v,
      [key]: key === 'organization_id' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.first_name.trim() || !values.last_name.trim()) return;
    setBusy(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit contact' : 'Add contact'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <div className="field">
          <label htmlFor="c-first">First name *</label>
          <input id="c-first" value={values.first_name} onChange={set('first_name')} autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="c-last">Last name *</label>
          <input id="c-last" value={values.last_name} onChange={set('last_name')} required />
        </div>
        <div className="field">
          <label htmlFor="c-email">Email</label>
          <input id="c-email" type="email" value={values.email} onChange={set('email')} />
        </div>
        <div className="field">
          <label htmlFor="c-phone">Phone</label>
          <input id="c-phone" value={values.phone} onChange={set('phone')} />
        </div>
        <div className="field">
          <label htmlFor="c-title">Job title</label>
          <input id="c-title" value={values.job_title} onChange={set('job_title')} />
        </div>
        <div className="field">
          <label htmlFor="c-org">Organization</label>
          <select id="c-org" value={values.organization_id === '' ? '' : String(values.organization_id)} onChange={set('organization_id')}>
            <option value="">— None —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="c-status">Status</label>
          <select id="c-status" value={values.status} onChange={set('status')}>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className="full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !values.first_name.trim() || !values.last_name.trim()}>
            {initial ? 'Save changes' : 'Add contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Deal ----------
export interface DealFormValues {
  name: string;
  organization_id: number | '';
  contact_id: number | '';
  stage: Stage;
  value: string;
  probability: string;
  close_date: string;
}

export function DealForm({
  initial,
  organizations,
  contacts,
  onSave,
  onClose
}: {
  initial?: Partial<DealRow>;
  organizations: Organization[];
  contacts: ContactRow[];
  onSave: (values: DealFormValues) => Promise<void> | void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<DealFormValues>({
    name: initial?.name ?? '',
    organization_id: initial?.organization_id ?? '',
    contact_id: initial?.contact_id ?? '',
    stage: initial?.stage ?? 'new',
    value: initial?.value !== undefined ? String(initial.value) : '',
    probability: initial?.probability !== undefined ? String(initial.probability) : '20',
    close_date: initial?.close_date ?? ''
  });
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof DealFormValues>(key: K) => (e: { target: { value: string } }) => {
    const value = e.target.value;
    setValues((v) => ({
      ...v,
      [key]:
        key === 'organization_id' || key === 'contact_id' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const orgContacts = contacts.filter(
    (c) => c.organization_id === values.organization_id || values.organization_id === ''
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!values.name.trim()) return;
    setBusy(true);
    try {
      await onSave(values);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={initial ? 'Edit deal' : 'Add deal'} onClose={onClose}>
      <form onSubmit={submit} className="form-grid">
        <div className="field full">
          <label htmlFor="d-name">Deal name *</label>
          <input id="d-name" value={values.name} onChange={set('name')} autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="d-org">Organization</label>
          <select id="d-org" value={values.organization_id === '' ? '' : String(values.organization_id)} onChange={set('organization_id')}>
            <option value="">— None —</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-contact">Primary contact</label>
          <select id="d-contact" value={values.contact_id === '' ? '' : String(values.contact_id)} onChange={set('contact_id')}>
            <option value="">— None —</option>
            {orgContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.first_name} {c.last_name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-stage">Stage</label>
          <select id="d-stage" value={values.stage} onChange={set('stage')}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="d-value">Value (USD) *</label>
          <input id="d-value" type="number" min="0" step="1000" value={values.value} onChange={set('value')} required />
        </div>
        <div className="field">
          <label htmlFor="d-prob">Probability (%)</label>
          <input id="d-prob" type="number" min="0" max="100" value={values.probability} onChange={set('probability')} />
        </div>
        <div className="field">
          <label htmlFor="d-close">Close date</label>
          <input id="d-close" type="date" value={values.close_date} onChange={set('close_date')} />
        </div>
        <div className="full" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy || !values.name.trim()}>
            {initial ? 'Save changes' : 'Add deal'}
          </button>
        </div>
      </form>
    </Modal>
  );
}