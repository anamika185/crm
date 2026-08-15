import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Mail, Phone, Building2, Briefcase, Handshake } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { ContactForm, type ContactFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar, StatusBadge, StageBadge } from '../components/badges';
import { Timeline } from '../components/Timeline';
import { ActivityForm } from '../components/ActivityForm';
import { formatMoney, formatDateShort, fullName } from '../utils';
import type { ContactDetail as ContactDetailData } from '../types';

export default function ContactDetail() {
  const { id } = useParams();
  const contactId = Number(id);
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.getContact(contactId), [contactId]);
  const { data: organizations } = useAsync(() => api.listOrganizations(), []);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || !data) return <Loading />;
  if (error) return <ErrorBanner message={error} />;

  const contact: ContactDetailData = data;

  const save = async (values: ContactFormValues) => {
    await api.updateContact(contact.id, {
      ...values,
      organization_id: values.organization_id === '' ? null : values.organization_id
    });
    await refresh();
    setEditing(false);
  };

  const confirmDelete = async () => {
    await api.deleteContact(contact.id);
    navigate('/contacts');
  };

  const toggleDone = async (activityId: number, done: boolean) => {
    await api.setActivityDone(activityId, done);
    await refresh();
  };

  const deleteActivity = async (activityId: number) => {
    await api.deleteActivity(activityId);
    await refresh();
  };

  const orgId = contact.organization_id;

  return (
    <div>
      <PageHeader
        title={fullName(contact)}
        subtitle={contact.job_title ?? 'Contact'}
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
            <Avatar first={contact.first_name} last={contact.last_name} size={52} />
            <div>
              <div className="detail-name">{fullName(contact)}</div>
              <div className="detail-title">
                {contact.job_title && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Briefcase size={13} /> {contact.job_title}
                  </span>
                )}
              </div>
            </div>
            <div>
              <StatusBadge status={contact.status} />
            </div>
            <div className="kv-list">
              {orgId && (
                <div className="kv-row">
                  <span className="kv-key">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Building2 size={13} /> Organization
                    </span>
                  </span>
                  <span className="kv-value">
                    <Linkish onClick={() => navigate(`/organizations/${orgId}`)}>{contact.organization_name}</Linkish>
                  </span>
                </div>
              )}
              <div className="kv-row">
                <span className="kv-key">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Mail size={13} /> Email
                  </span>
                </span>
                <span className="kv-value">{contact.email ?? '—'}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Phone size={13} /> Phone
                  </span>
                </span>
                <span className="kv-value">{contact.phone ?? '—'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          {contact.deals.length > 0 && (
            <section>
              <h3 className="section-title">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Handshake size={16} /> Deals ({contact.deals.length})
                </span>
              </h3>
              <div className="card">
                <div className="table-wrap">
                  <table className="data">
                    <thead>
                      <tr>
                        <th>Deal</th>
                        <th>Stage</th>
                        <th>Value</th>
                        <th>Close date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contact.deals.map((d) => (
                        <tr key={d.id} onClick={() => navigate(`/deals/${d.id}`)}>
                          <td className="cell-strong">{d.name}</td>
                          <td>
                            <StageBadge stage={d.stage} />
                          </td>
                          <td>{formatMoney(d.value)}</td>
                          <td>{formatDateShort(d.close_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          <section>
            <h3 className="section-title">Activity</h3>
            <ActivityForm contactId={contact.id} onAdded={refresh} />
            <Timeline
              activities={contact.activities}
              onToggleDone={toggleDone}
              onDelete={deleteActivity}
            />
          </section>
        </div>
      </div>

      {editing && (
        <ContactForm
          initial={contact}
          organizations={organizations ?? []}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete contact"
          message={`Delete ${fullName(contact)}? This will also remove their associated activities.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(false)}
        />
      )}
    </div>
  );
}

function Linkish({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick(); }}>
      {children}
    </a>
  );
}