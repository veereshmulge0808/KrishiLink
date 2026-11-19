import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Button } from '../ui/button';
import { TableSkeleton } from './Skeletons';
import { EmptyState } from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchKey?: keyof T;
  isLoading?: boolean;
  filename?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search...',
  searchKey,
  isLoading = false,
  filename = 'export.csv',
  pageSize = 10,
  className = '',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!search || !searchKey) return data;
    const q = search.toLowerCase();
    return data.filter((item) => {
      const val = item[searchKey];
      return String(val || '').toLowerCase().includes(q);
    });
  }, [data, search, searchKey]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExportCsv = () => {
    if (sortedData.length === 0) return;
    const headers = columns.map((c) => c.header).join(',');
    const rows = sortedData.map((row) =>
      columns
        .map((c) => {
          const val = c.accessorKey ? row[c.accessorKey] : '';
          return `"${String(val || '').replace(/"/g, '""')}"`;
        })
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return <TableSkeleton rows={pageSize} />;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {searchKey && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-primary dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCsv}
          className="ml-auto text-xs font-bold flex items-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Table view */}
      {paginatedData.length === 0 ? (
        <EmptyState title="No records found" description="Try adjusting your search or filters." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-500 uppercase tracking-wider dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="p-3.5 cursor-pointer select-none"
                    onClick={() => col.sortable && handleSort(col.accessorKey)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{col.header}</span>
                      {col.sortable && <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedData.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60">
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-3.5 text-slate-800 dark:text-slate-200 font-medium">
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String(row[col.accessorKey] ?? '-')
                        : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 dark:border-slate-800 text-xs text-slate-500">
            <span>
              Showing {paginatedData.length} of {sortedData.length} entries
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
