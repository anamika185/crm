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
import { ContactForm, type ContactFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Avatar, StatusBadge } from '../components/badges';
import { fullName } from '../utils';
import type { ContactRow, ContactStatus } from '../types';

const column = createColumnHelper<ContactRow>();

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'lead', label: 'Lead' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'customer', label: 'Customer' }
];

export default function Contacts() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.listContacts('', 'all'), []);
  const { data: organizations } = useAsync(() => api.listOrganizations(), []);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContactStatus | 'all'>('all');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ContactRow | null>(null);
  const [deleting, setDeleting] = useState<ContactRow | null>(null);

  const columns = useMemo(
    () => [
      column.accessor('last_name', {
        header: 'Name',
        cell: (info) => {
          const c = info.row.original;
          return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <Avatar first={c.first_name} last={c.last_name} size={30} />
              <span>
                <div className="cell-strong">{fullName(c)}</div>
                <div className="cell-sub">{c.job_title ?? '—'}</div>
              </span>
            </span>
          );
        }
      }),
      column.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue() ?? <span className="muted">—</span>
      }),
      column.accessor('phone', {
        header: 'Phone',
        cell: (info) => info.getValue() ?? <span className="muted">—</span>
      }),
      column.accessor('organization_name', {
        header: 'Organization',
        cell: (info) => info.getValue() ?? <span className="muted">—</span>
      }),
      column.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />
      }),
      column.display({
        id: 'actions',
        header: () => <span style={{ paddingRight: 8 }}></span>,
        cell: (info) => (
          <span className="row-actions" onClick={(e) => e.stopPropagation()}>
            <button
              className="icon-btn"
              aria-label={`Edit ${fullName(info.row.original)}`}
              onClick={() => setEditing(info.row.original)}
            >
              <Pencil size={15} />
            </button>
            <button
              className="icon-btn danger"
              aria-label={`Delete ${fullName(info.row.original)}`}
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

  const columnFilters = useMemo(
    () => (status === 'all' ? [] : [{ id: 'status', value: status }]),
    [status]
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    state: { sorting, globalFilter: search, columnFilters },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString'
  });

  const saveContact = async (values: ContactFormValues) => {
    const payload = {
      ...values,
      organization_id: values.organization_id === '' ? null : values.organization_id
    };
    if (editing) {
      await api.updateContact(editing.id, payload);
    } else {
      await api.createContact(payload);
    }
    await refresh();
    setShowForm(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await api.deleteContact(deleting.id);
    await refresh();
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title="Contacts"
        subtitle="The people you deal with"
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add contact
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
                placeholder="Search contacts by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search contacts"
              />
            </div>
            <div className="filter-pills" role="group" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`filter-pill ${status === f.value ? 'active' : ''}`}
                  onClick={() => setStatus(f.value as ContactStatus | 'all')}
                >
                  {f.label}
                </button>
              ))}
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
                    <td className="empty-row" colSpan={6}>
                      {search || status !== 'all'
                        ? 'No contacts match your filters.'
                        : 'No contacts yet. Add your first one.'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} onClick={() => navigate(`/contacts/${row.original.id}`)}>
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
        <ContactForm
          initial={editing ?? undefined}
          organizations={organizations ?? []}
          onSave={saveContact}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete contact"
          message={`Delete ${fullName(deleting)}? This will also remove their associated activities.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}