import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Globe, Pencil, Trash2, Building2 } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { OrganizationForm, type OrgFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar, StageBadge, StatusBadge } from '../components/badges';
import { formatMoney, formatDateShort, fullName } from '../utils';
import type { ContactRow, DealRow, Organization } from '../types';

export default function OrganizationDetail() {
  const { id } = useParams();
  const orgId = Number(id);
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(
    () => api.getOrganization(orgId),
    [orgId]
  );
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || !data) return <Loading />;
  if (error) return <ErrorBanner message={error} />;

  const org: Organization & { contacts: ContactRow[]; deals: DealRow[] } = data;

  const save = async (values: OrgFormValues) => {
    await api.updateOrganization(org.id, values);
    await refresh();
    setEditing(false);
  };

  const confirmDelete = async () => {
    await api.deleteOrganization(org.id);
    navigate('/organizations');
  };

  return (
    <div>
      <PageHeader
        title={org.name}
        subtitle={org.industry ?? 'Organization'}
        actions={
          <>
            <button className="btn btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={15} /> Edit
            </button>
            <button className="btn btn-danger" onClick={() => setDeleting(true)}>
              <Trash2 size={15} /> Delete
            </button>
          </>
        }
      />

      <div className="detail-grid">
        <div className="card">
          <div className="detail-hero">
            <Avatar first={org.name} last="" size={52} />
            <div>
              <div className="detail-name">{org.name}</div>
              <div className="detail-title">{org.industry ?? 'No industry set'}</div>
            </div>
            <div className="kv-list">
              <div className="kv-row">
                <span className="kv-key">Website</span>
                <span className="kv-value">
                  {org.website ? (
                    <a href={`https://${org.website}`} target="_blank" rel="noreferrer">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Globe size={13} /> {org.website}
                      </span>
                    </a>
                  ) : (
                    '—'
                  )}
                </span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Contacts</span>
                <span className="kv-value">{org.contacts.length}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">Deals</span>
                <span className="kv-value">{org.deals.length}</span>
              </div>
            </div>
            {org.notes && (
              <div className="card" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-500)', marginBottom: 4 }}>Notes</div>
                <div style={{ color: 'var(--gray-700)', whiteSpace: 'pre-wrap' }}>{org.notes}</div>
              </div>
            )}
          </div>
        </div>

        <div className="stack">
          <section>
            <h3 className="section-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <Building2 size={16} /> Contacts ({org.contacts.length})
              </span>
            </h3>
            <div className="card">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {org.contacts.length === 0 ? (
                      <tr>
                        <td className="empty-row" colSpan={4}>
                          No contacts yet.
                        </td>
                      </tr>
                    ) : (
                      org.contacts.map((c) => (
                        <tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}>
                          <td>
                            <span className="cell-strong">{fullName(c)}</span>
                          </td>
                          <td className="cell-sub">{c.job_title ?? '—'}</td>
                          <td>{c.email ?? '—'}</td>
                          <td>
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section>
            <h3 className="section-title">Deals ({org.deals.length})</h3>
            <div className="card">
              <div className="table-wrap">
                <table className="data">
                  <thead>
                    <tr>
                      <th>Deal</th>
                      <th>Stage</th>
                      <th>Value</th>
                      <th>Expected</th>
                      <th>Close date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {org.deals.length === 0 ? (
                      <tr>
                        <td className="empty-row" colSpan={5}>
                          No deals yet.
                        </td>
                      </tr>
                    ) : (
                      org.deals.map((d) => (
                        <tr key={d.id} onClick={() => navigate(`/deals/${d.id}`)}>
                          <td className="cell-strong">{d.name}</td>
                          <td>
                            <StageBadge stage={d.stage} />
                          </td>
                          <td>{formatMoney(d.value)}</td>
                          <td>{formatMoney(d.value * (d.probability / 100))}</td>
                          <td>{formatDateShort(d.close_date)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>

      {editing && <OrganizationForm initial={org} onSave={save} onClose={() => setEditing(false)} />}
      {deleting && (
        <ConfirmDialog
          title="Delete organization"
          message={`Delete “${org.name}”? This will also remove its ${org.contacts.length} contact${org.contacts.length === 1 ? '' : 's'} and ${org.deals.length} deal${org.deals.length === 1 ? '' : 's'} and their activities.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}