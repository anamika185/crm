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
import { Plus, Pencil, Trash2, Search, Globe } from 'lucide-react';
import { api } from '../api';
import { useAsync, Loading, ErrorBanner } from '../hooks';
import { PageHeader } from '../components/Layout';
import { OrganizationForm, type OrgFormValues } from '../components/forms';
import { ConfirmDialog } from '../components/ConfirmDialog';
import type { OrganizationRow } from '../types';

const column = createColumnHelper<OrganizationRow>();

export default function Organizations() {
  const navigate = useNavigate();
  const { data, loading, error, refresh } = useAsync(() => api.listOrganizations(), []);
  const [search, setSearch] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrganizationRow | null>(null);
  const [deleting, setDeleting] = useState<OrganizationRow | null>(null);

  const columns = useMemo(
    () => [
      column.accessor('name', {
        header: 'Name',
        cell: (info) => <span className="cell-strong">{info.getValue()}</span>
      }),
      column.accessor('industry', {
        header: 'Industry',
        cell: (info) => info.getValue() ?? <span className="muted">—</span>
      }),
      column.accessor('website', {
        header: 'Website',
        cell: (info) =>
          info.getValue() ? (
            <a href={`https://${info.getValue()}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Globe size={13} />
                {info.getValue()}
              </span>
            </a>
          ) : (
            <span className="muted">—</span>
          )
      }),
      column.accessor('contact_count', {
        header: 'Contacts',
        cell: (info) => info.getValue()
      }),
      column.accessor('deal_count', {
        header: 'Deals',
        cell: (info) => info.getValue()
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

  const saveOrg = async (values: OrgFormValues) => {
    if (editing) {
      await api.updateOrganization(editing.id, values);
    } else {
      await api.createOrganization(values);
    }
    await refresh();
    setShowForm(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await api.deleteOrganization(deleting.id);
    await refresh();
    setDeleting(null);
  };

  return (
    <div>
      <PageHeader
        title="Organizations"
        subtitle="The companies you do business with"
        actions={
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={16} /> Add organization
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
                placeholder="Search organizations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search organizations"
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
                    <td className="empty-row" colSpan={6}>
                      {search ? `No organizations match “${search}”.` : 'No organizations yet. Add your first one.'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} onClick={() => navigate(`/organizations/${row.original.id}`)}>
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
        <OrganizationForm
          initial={editing ?? undefined}
          onSave={saveOrg}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete organization"
          message={`Delete “${deleting.name}”? This will also remove its ${deleting.contact_count} contact${deleting.contact_count === 1 ? '' : 's'} and ${deleting.deal_count} deal${deleting.deal_count === 1 ? '' : 's'} and their activities.`}
          onConfirm={confirmDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}