import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState
} from '@tanstack/react-table';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { DealForm, type DealFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StageBadge } from '../components/badges';
import { formatMoney, formatDateShort, fullName } from '../utils';
import type { DealRow } from '../types';

const column = createColumnHelper<DealRow>();

export default function Deals() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.listDeals(), []);
  const { data: organizations } = useAsync(() => api.listOrganizations(), []);
  const { data: contacts } = useAsync(() => api.listContacts('', 'all'), []);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DealRow | null>(null);
  const [deleting, setDeleting] = useState<DealRow | null>(null);

  const columns = useMemo(
    () => [
      column.accessor('name', {
        header: 'Deal',
        cell: (info) => <span className="cell-strong">{info.getValue()}</span>
      }),
      column.accessor('organization_name', {
        header: 'Organization',
        cell: (info) => info.getValue() ?? <span className="muted">—</span>
      }),
      column.accessor('contact_last_name', {
        header: 'Primary contact',
        cell: (info) => {
          const d = info.row.original;
          return d.contact_first_name ? fullName({ first_name: d.contact_first_name, last_name: d.contact_last_name ?? '' }) : <span className="muted">—</span>;
        }
      }),
      column.accessor('stage', {
        header: 'Stage',
        cell: (info) => <StageBadge stage={info.getValue()} />
      }),
      column.accessor('value', {
        header: 'Value',
        cell: (info) => <span className="cell-strong">{formatMoney(info.getValue())}</span>
      }),
      column.accessor('probability', {
        header: 'Expected',
        cell: (info) => {
          const d = info.row.original;
          return formatMoney(d.value * (d.probability / 100));
        }
      }),
      column.accessor('close_date', {
        header: 'Close date',
        cell: (info) => formatDateShort(info.getValue())
      }),
      column.display({
        id: 'actions',
        header: () => <span style={{ paddingRight: 8 }}></span>,
        cell: (info) => (
          <span className="row-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn"
              aria-label={`Edit ${info.row.original.name}`}
              onClick={() => setEditing(info.row.original)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              aria-label={`Delete ${info.row.original.name}`}
              onClick={() => setDeleting(info.row.original)}
            >
              <Trash2 size={15} />
            </button>
          </span>
        )
      })
    ],
    []
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter: search },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString'
  });

  const saveDeal = async (values: DealFormValues) => {
    const payload = {
      name: values.name,
      organization_id: values.organization_id === '' ? null : values.organization_id,
      contact_id: values.contact_id === '' ? null : values.contact_id,
      stage: values.stage,
      value: Number(values.value) || 0,
      probability: values.probability === '' ? 20 : Number(values.probability),
      close_date: values.close_date || null
    };
    if (editing) {
      await api.updateDeal(editing.id, payload);
    } else {
      await api.createDeal(payload);
    }
    await refresh();
    setShowForm(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await api.deleteDeal(deleting.id);
    await refresh();
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title="Deals"
        subtitle="The potential sales you're working on"
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add deal
          </button>
        }
      />

      {error && <ErrorBanner message={error} />}

      <div className="card">
        <div className="card-pad" style={{ paddingBottom: 0 }}>
          <div className="toolbar">
            <div className="search-box">
              <Search size={16} />
              <input
                placeholder="Search deals by name, organization or contact…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search deals"
              />
            </div>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {table.getRowModel().rows.length} of {data?.length ?? 0}
            </span>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="table-wrap">
            <table className="data">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        style={header.column.getCanSort() ? { cursor: 'pointer' } : undefined}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: ' ▲',
                          desc: ' ▼'
                        }[header.column.getIsSorted() as string] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td className="empty-row" colSpan={8}>
                      {search ? `No deals match “${search}”.` : 'No deals yet. Add your first one.'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} onClick={() => navigate(`/deals/${row.original.id}`)}>
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(showForm || editing) && (
        <DealForm
          initial={editing ?? undefined}
          organizations={organizations ?? []}
          contacts={contacts ?? []}
          onSave={saveDeal}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete deal"
          message={`Delete deal “${deleting.name}” worth ${formatMoney(deleting.value)}? Its activities will also be removed.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}