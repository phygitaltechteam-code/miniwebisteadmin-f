import React, {useState} from 'react';
import {FiEdit} from 'react-icons/fi';
import {GrFormNext, GrFormPrevious} from 'react-icons/gr';
import {MdDelete} from 'react-icons/md';
import {FiEye} from 'react-icons/fi';
import {FaArrowLeft} from 'react-icons/fa';

type Button<T> = {
  label: string;
  onClick: (item: T) => void;
  className?: string;
  icon?: React.ReactNode;
};

export type Column<T> = {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  render?: (item: T) => React.ReactNode;
  className?: string;
  buttons?: Button<T>[];
  sortable?: boolean;
  action?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onCellClick?: (item: T) => void;
};

type GenericTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  itemsPerPage?: number;
  searchAble?: boolean;
  title?: string;
  action?: boolean;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  paginationOff?: boolean;
  onView?: (item: T) => void;
  onRowClick?: (item: T) => void;
  showBackButton?: boolean;
  onBack?: () => void;
  headerAction?: React.ReactNode;
  showSrNo?: boolean;
};

export const GenericTable = <T,>({
  data,
  columns,
  itemsPerPage = 5,
  searchAble,
  action,
  title,
  onEdit: handleEdit,
  onDelete: handleDelete,
  paginationOff = false,
  onView,
  onRowClick,
  showBackButton = false,
  onBack,
  headerAction,
  showSrNo = false,
}: GenericTableProps<T>) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T;
    direction: 'asc' | 'desc';
  } | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const sortedData = React.useMemo(() => {
    const sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        const aValue =
          typeof sortConfig.key === 'function'
            ? (sortConfig.key as (a: T) => string | number | boolean)(a)
            : a[sortConfig.key];
        const bValue =
          typeof sortConfig.key === 'function'
            ? (sortConfig.key as (a: T) => string | number | boolean)(b)
            : b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const handleSort = (key: keyof T) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }
    setSortConfig({key, direction});
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return sortedData;
    const q = searchQuery.toLowerCase();
    return sortedData.filter((item) =>
      columns.some((column) => {
        const value =
          typeof column.accessor === 'function'
            ? column.accessor(item)
            : item[column.accessor];
        return (
          value !== null &&
          value !== undefined &&
          String(value).toLowerCase().includes(q)
        );
      }),
    );
  }, [sortedData, searchQuery, columns]);

  const totalItems = filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;

  const paginatedData = paginationOff
    ? filteredData
    : filteredData.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="rounded-xl border border-stroke bg-white px-4 pb-3 pt-4 shadow-xs dark:border-strokedark dark:bg-boxdark sm:px-6">
      {title && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="hover:bg-gray-100 rounded-lg p-1.5 dark:hover:bg-meta-4 transition-colors"
              >
                <FaArrowLeft className="h-4 w-4" />
              </button>
            )}

            <h2 className="text-lg font-bold text-black dark:text-white">{title}</h2>
          </div>

          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </div>
      )}

      {searchAble && (
        <div className="mb-3 flex justify-between">
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full rounded border-[1.5px] border-stroke bg-transparent px-3 py-1.5 text-sm outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
          />
        </div>
      )}
      <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 dark:border-strokedark">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-[#1E40AF] text-left text-white shadow-xs dark:bg-blue-950">
              {showSrNo && (
                <th className="w-14 px-3 py-2.5 font-bold text-white text-xs sm:text-sm text-center">
                  Sr. No.
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`min-w-[110px] px-3.5 py-2.5 font-semibold text-white tracking-wide text-xs sm:text-sm ${column.className || ''}`}
                  onClick={
                    column.sortable
                      ? () => handleSort(column.accessor as keyof T)
                      : undefined
                  }
                  style={{cursor: column.sortable ? 'pointer' : 'default'}}
                >
                  <div className="flex items-center gap-1 font-bold text-white">
                    <span>{column.header}</span>
                    {sortConfig?.key === column.accessor && (
                      <span className="text-xs text-blue-200 font-bold">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {action && (
                <th className="min-w-[90px] px-3.5 py-2.5 font-bold text-white text-xs sm:text-sm">
                  <div>Action</div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item, rowIndex) => {
              const isEven = rowIndex % 2 === 0;
              const rowBg = isEven
                ? 'bg-white dark:bg-boxdark'
                : 'bg-[#F0F6FF] dark:bg-boxdark-2/60';

              return (
                <tr
                  key={rowIndex}
                  className={`text-sm ${rowBg} ${
                    onRowClick
                      ? 'cursor-pointer hover:bg-blue-100/70 dark:hover:bg-meta-4 transition-colors'
                      : 'hover:bg-blue-100/40 dark:hover:bg-meta-4 transition-colors'
                  }`}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, a, input, select, svg, .no-row-click')) return;
                    onRowClick?.(item);
                  }}
                >
                  {showSrNo && (
                    <td className="w-14 border-b border-slate-100 px-3 py-2 text-center text-xs font-semibold text-slate-700 dark:border-strokedark dark:text-slate-300">
                      {(currentPage - 1) * itemsPerPage + rowIndex + 1}
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const value =
                      typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : item[column.accessor];

                    return (
                      <td
                        key={colIndex}
                        className="border-b border-slate-100 px-3.5 py-2 text-slate-800 dark:border-strokedark dark:text-slate-200"
                        onClick={() => {
                          if (column.onCellClick) {
                            column.onCellClick(item);
                          }
                        }}
                        style={{
                          cursor: column.onCellClick
                            ? 'pointer'
                            : onRowClick
                            ? 'pointer'
                            : 'default',
                        }}
                      >
                        <div className="py-0.5">
                          {column.render
                            ? column.render(item)
                            : React.isValidElement(value)
                            ? value
                            : typeof value === 'string' || typeof value === 'number'
                            ? value
                            : value === null || value === undefined
                            ? ''
                            : String(value)}
                          {column.buttons && (
                            <div className="mt-1 space-x-1.5">
                              {column.buttons.map((button, btnIndex) => (
                                <button
                                  key={btnIndex}
                                  onClick={() => button.onClick(item)}
                                  className={`rounded px-2 py-0.5 text-xs ${button.className || ''}`}
                                >
                                  {button.icon || button.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  {action && (
                    <td className="border-b border-slate-100 px-3.5 py-2 dark:border-strokedark">
                      <div className="flex items-center gap-1.5 py-0.5">
                        {onView && (
                          <button
                            className="hover:bg-blue-100 rounded p-1 text-slate-600 hover:text-blue-700 dark:hover:bg-meta-4 transition-colors"
                            onClick={() => onView(item)}
                            title="View"
                          >
                            <FiEye className="h-4 w-4" />
                          </button>
                        )}
                        {handleEdit && (
                          <button
                            className="hover:bg-blue-100 rounded p-1 text-slate-600 hover:text-blue-700 dark:hover:bg-meta-4 transition-colors"
                            onClick={() => handleEdit(item)}
                            title="Edit"
                          >
                            <FiEdit className="h-4 w-4" />
                          </button>
                        )}
                        {handleDelete && (
                          <button
                            className="hover:bg-rose-100 rounded p-1 text-slate-600 hover:text-rose-600 dark:hover:bg-meta-4 transition-colors"
                            onClick={() => handleDelete(item)}
                            title="Delete"
                          >
                            <MdDelete className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {!paginationOff && (
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <div className="space-x-2">
            <button
              className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <GrFormPrevious className="h-4 w-4" />
            </button>
            <button
              className="hover:bg-gray-100 rounded p-1.5 dark:hover:bg-meta-4"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <GrFormNext className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericTable;
