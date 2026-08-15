import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Pencil, Trash2, Building2, User, CalendarDays, Target, Banknote, History } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { DealForm, type DealFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StageBadge } from '../components/badges';
import { Timeline } from '../components/Timeline';
import { ActivityForm } from '../components/ActivityForm';
import { formatMoney, formatDateShort, fullName } from '../utils';
import type { DealDetail as DealDetailData } from '../types';

export default function DealDetail() {
  const { id } = useParams();
  const dealId = Number(id);
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.getDeal(dealId), [dealId]);
  const { data: organizations } = useAsync(() => api.listOrganizations(), []);
  const { data: contacts } = useAsync(() => api.listContacts('', 'all'), []);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading || !data) return <Loading />;
  if (error) return <ErrorBanner message={error} />;

  const deal: DealDetailData = data;

  const save = async (values: DealFormValues) => {
    await api.updateDeal(deal.id, {
      name: values.name,
      organization_id: values.organization_id === '' ? null : values.organization_id,
      contact_id: values.contact_id === '' ? null : values.contact_id,
      stage: values.stage,
      value: Number(values.value) || 0,
      probability: values.probability === '' ? 20 : Number(values.probability),
      close_date: values.close_date || null
    });
    await refresh();
    setEditing(false);
  };

  const confirmDelete = async () => {
    await api.deleteDeal(deal.id);
    navigate('/deals');
  };

  const toggleDone = async (activityId: number, done: boolean) => {
    await api.setActivityDone(activityId, done);
    await refresh();
  };

  const deleteActivity = async (activityId: number) => {
    await api.deleteActivity(activityId);
    await refresh();
  };

  const expected = deal.value * (deal.probability / 100);

  return (
    <div>
      <PageHeader
        title={deal.name}
        subtitle={<StageBadge stage={deal.stage} />}
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
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="kpi-icon" style={{ background: 'var(--amber-light)', color: 'var(--amber-dark)' }}>
                <Banknote size={18} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}>{formatMoney(deal.value)}</div>
                <div className="cell-sub">Expected {formatMoney(expected)} at {deal.probability}%</div>
              </div>
            </div>
            <div className="kv-list">
              {deal.organization_id && (
                <div className="kv-row">
                  <span className="kv-key">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Building2 size={13} /> Organization
                    </span>
                  </span>
                  <span className="kv-value">
                    <Linkish onClick={() => navigate(`/organizations/${deal.organization_id}`)}>
                      {deal.organization_name}
                    </Linkish>
                  </span>
                </div>
              )}
              {deal.contact_id && (
                <div className="kv-row">
                  <span className="kv-key">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <User size={13} /> Primary contact
                    </span>
                  </span>
                  <span className="kv-value">
                    <Linkish onClick={() => navigate(`/contacts/${deal.contact_id}`)}>
                      {fullName({ first_name: deal.contact_first_name ?? '', last_name: deal.contact_last_name ?? '' })}
                    </Linkish>
                  </span>
                </div>
              )}
              <div className="kv-row">
                <span className="kv-key">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <CalendarDays size={13} /> Close date
                  </span>
                </span>
                <span className="kv-value">{formatDateShort(deal.close_date)}</span>
              </div>
              <div className="kv-row">
                <span className="kv-key">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Target size={13} /> Probability
                  </span>
                </span>
                <span className="kv-value">{deal.probability}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stack">
          <section>
            <h3 className="section-title">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <History size={16} /> Activity
              </span>
            </h3>
            <ActivityForm dealId={deal.id} onAdded={refresh} />
            <Timeline activities={deal.activities} onToggleDone={toggleDone} onDelete={deleteActivity} />
          </section>
        </div>
      </div>

      {editing && (
        <DealForm
          initial={deal}
          organizations={organizations ?? []}
          contacts={contacts ?? []}
          onSave={save}
          onClose={() => setEditing(false)}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete deal"
          message={`Delete deal “${deal.name}” worth ${formatMoney(deal.value)}? Its activities will also be removed.`}
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