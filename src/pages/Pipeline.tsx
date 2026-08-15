import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragEndEvent
} from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { DealForm, type DealFormValues } from '../components/forms';
import { STAGES, type Stage, type DealRow } from '../types';
import { STAGE_LABELS, formatMoney, formatDateShort } from '../utils';

export default function Pipeline() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.getPipeline(), []);
  const { data: organizations } = useAsync(() => api.listOrganizations(), []);
  const { data: contacts } = useAsync(() => api.listContacts('', 'all'), []);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [stageForNew, setStageForNew] = useState<Stage>('new');

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const dealId = Number(active.data.current?.dealId);
    const fromStage = active.data.current?.stage as Stage;
    const toStage = over.id as Stage;
    if (!dealId || fromStage === toStage) return;
    setErrorMsg(null);
    try {
      await api.setDealStage(dealId, toStage);
      await refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update stage');
    }
  };

  const openAdd = (stage: Stage) => {
    setStageForNew(stage);
    setShowForm(true);
  };

  const saveDeal = async (values: DealFormValues) => {
    await api.createDeal({
      name: values.name,
      organization_id: values.organization_id === '' ? null : values.organization_id,
      contact_id: values.contact_id === '' ? null : values.contact_id,
      stage: values.stage,
      value: Number(values.value) || 0,
      probability: values.probability === '' ? 20 : Number(values.probability),
      close_date: values.close_date || null
    });
    await refresh();
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader
        title="Pipeline"
        subtitle="Drag deals between stages to move them along"
        actions={
          <button className="btn btn-primary" onClick={() => openAdd('new')}>
            <Plus size={16} /> Add deal
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}
      {errorMsg && <ErrorBanner message={errorMsg} />}

      {loading ? (
        <Loading />
      ) : (
        <DndContext collisionDetection={pointerWithin} onDragEnd={onDragEnd}>
          <div className="pipeline-board">
            {STAGES.map((stage) => {
              const column = data?.find((c) => c.stage === stage);
              const deals = column?.deals ?? [];
              const total = column?.totalValue ?? 0;
              const expected = column?.expectedRevenue ?? 0;
              return (
                <Column
                  key={stage}
                  stage={stage}
                  count={deals.length}
                  totalValue={total}
                  expectedRevenue={expected}
                  deals={deals}
                  onOpen={navigate}
                  onAdd={() => openAdd(stage)}
                />
              );
            })}
          </div>
        </DndContext>
      )}

      {showForm && (
        <DealForm
          initial={{ stage: stageForNew }}
          organizations={organizations ?? []}
          contacts={contacts ?? []}
          onSave={saveDeal}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

function Column({
  stage,
  count,
  totalValue,
  expectedRevenue,
  deals,
  onOpen,
  onAdd
}: {
  stage: Stage;
  count: number;
  totalValue: number;
  expectedRevenue: number;
  deals: DealRow[];
  onOpen: (id: number) => void;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  return (
    <div ref={setNodeRef} className={`pipeline-column ${isOver ? 'highlight' : ''}`}>
      <div className="pipeline-column-header">
        <span className="pipeline-stage-name">
          {STAGE_LABELS[stage]} <span className="pipeline-count">{count}</span>
        </span>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={onAdd} aria-label={`Add deal to ${STAGE_LABELS[stage]}`}>
          <Plus size={15} />
        </button>
      </div>
      <div className="pipeline-stats">
        <span>
          Total <span className="strong">{formatMoney(totalValue)}</span>
        </span>
        <span>
          Expected <span className="strong">{formatMoney(expectedRevenue)}</span>
        </span>
      </div>
      <div className="pipeline-cards">
        {deals.length === 0 ? (
          <div className="empty-col">Drop deals here</div>
        ) : (
          deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onOpen }: { deal: DealRow; onOpen: (id: number) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
    data: { dealId: deal.id, stage: deal.stage }
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`deal-card ${isDragging ? 'dragging' : ''}`}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(deal.id);
      }}
      title="Drag to move between stages · click to open"
    >
      <div className="deal-card-name">{deal.name}</div>
      <div className="deal-card-org">{deal.organization_name ?? '—'}</div>
      <div className="deal-card-bottom">
        <span className="deal-card-value">{formatMoney(deal.value)}</span>
        <span className="deal-card-date">{formatDateShort(deal.close_date)}</span>
      </div>
    </div>
  );
}