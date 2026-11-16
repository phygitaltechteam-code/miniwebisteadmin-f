import React, {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import GenericTable, {type Column} from '@/components/Forms/Table/GenericTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import useDebounce from '@/hooks/useDebounce';
import {
  useCreateCustomer,
  useCustomers,
  useDeleteCustomer,
  useUpdateCustomer,
} from '@/lib/react-query/customers';
import {formatDay, utcDay} from '@/lib/leads/dates';
import {telHref, whatsAppHref, whatsAppNumber} from '@/lib/leads/templates';
import type {Customer, CustomerInput} from '@/types/customer';

const PAGE_SIZE = 25;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hasValue = (v?: string | null) => !!v && v.trim() !== '';

type FormState = {mode: 'add'} | {mode: 'edit'; customer: Customer} | null;

/**
 * Customers of one business: won leads moved over ("Move to customers") or added here.
 * Owners see their own; super admins and franchise users pass the business's adminId.
 */
export const CustomersPage: React.FC<{adminId?: string}> = ({adminId}) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [debouncedSearch]);

  const {data, isLoading, isFetching, isError, refetch} = useCustomers(
    {search: debouncedSearch.trim() || undefined, page, limit: PAGE_SIZE},
    adminId,
  );
  const createCustomer = useCreateCustomer(adminId);
  const updateCustomer = useUpdateCustomer(adminId);
  const deleteCustomer = useDeleteCustomer(adminId);

  const customers = data?.customers ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);
  const firstRow = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(total, (page - 1) * PAGE_SIZE + customers.length);

  const [form, setForm] = useState<FormState>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);

  const handleSubmit = async (values: CustomerInput) => {
    try {
      if (form?.mode === 'edit') {
        await updateCustomer.mutateAsync({id: form.customer.id, input: values});
        toast.success('Customer updated');
      } else {
        await createCustomer.mutateAsync(values);
        toast.success('Customer added');
      }
      setForm(null);
    } catch {
      // The mutation already showed the error; keep the form open
    }
  };

  const iconBtn =
    'inline-flex h-7 w-7 items-center justify-center rounded border border-[#E0E0E0] text-[#616161] transition-colors';

  const columns: Column<Customer>[] = [
    {
      header: 'Customer',
      accessor: 'fullname',
      className: 'min-w-[200px]',
      render: (c) => (
        <div className="min-w-0">
          <p className="max-w-[260px] truncate font-medium text-[#212121]">
            {c.fullname || c.company || c.phoneNumber || 'Unnamed customer'}
          </p>
          {hasValue(c.company) && hasValue(c.fullname) && (
            <p className="max-w-[260px] truncate text-[12px] text-[#6B7280]">
              {c.company}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'phoneNumber',
      render: (c) => (
        <div className="text-[12.5px] leading-snug">
          {hasValue(c.phoneNumber) && (
            <p className="whitespace-nowrap text-[#212121]">{c.phoneNumber}</p>
          )}
          {hasValue(c.secondaryPhoneNumber) && (
            <p className="whitespace-nowrap text-[#6B7280]">
              {c.secondaryPhoneNumber}
            </p>
          )}
          {hasValue(c.email) && (
            <p className="max-w-[200px] truncate text-[#6B7280]">{c.email}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Address',
      accessor: 'address',
      render: (c) => (
        <p className="line-clamp-2 max-w-[240px] text-[12.5px] text-[#424242]">
          {c.address || '–'}
        </p>
      ),
    },
    {
      header: 'Added',
      accessor: 'createdAt',
      render: (c) => {
        const day = utcDay(c.createdAt);
        return (
          <div className="text-[12.5px] leading-snug">
            <p className="whitespace-nowrap text-[#424242]">
              {day ? formatDay(day) : '–'}
            </p>
            {c.leadId && (
              <p className="text-[11px] text-[#2E7D32]">From a lead</p>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (c) => {
        const phone = (c.phoneNumber || c.secondaryPhoneNumber || '').trim();
        const wa = whatsAppNumber({
          mobile: c.phoneNumber,
          otherPhone: c.secondaryPhoneNumber,
        });
        const email = (c.email || '').trim();
        return (
          <div className="flex items-center gap-1">
            {phone && (
              <a
                href={telHref(phone)}
                className={`${iconBtn} hover:border-[#2E7D32] hover:text-[#2E7D32]`}
                title={`Call ${phone}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {wa && (
              <a
                href={whatsAppHref(wa, '')}
                target="_blank"
                rel="noopener noreferrer"
                className={`${iconBtn} hover:border-[#00897B] hover:text-[#00897B]`}
                title="WhatsApp"
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email.replace(/[\s?&#]/g, '')}`}
                className={`${iconBtn} hover:border-[#6A1B9A] hover:text-[#6A1B9A]`}
                title={`Email ${email}`}
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setForm({mode: 'edit', customer: c})}
              className={`${iconBtn} hover:border-[#2196F3] hover:text-[#2196F3]`}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(c)}
              className={`${iconBtn} hover:border-rose-300 hover:text-rose-600`}
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-2 py-3 pb-16 font-['Roboto',Helvetica,Arial,sans-serif] sm:px-4 sm:py-4 lg:px-6">
      <section className="shadow-xs flex flex-col gap-3 rounded-lg border border-[#E0E0E0] bg-white p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold text-[#212121]">
              Customers
            </h1>
            <span className="text-[12px] text-[#6B7280]">
              {isLoading ? '' : `${total.toLocaleString('en-IN')} total`}
            </span>
            {isFetching && !isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9CA3AF]" />
            )}
          </div>
          <button
            type="button"
            onClick={() => setForm({mode: 'add'})}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#1E88E5]"
          >
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, company, phone, email…"
            className="w-full rounded border border-[#E0E0E0] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#212121] focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-[#6B7280]">
            <Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Loading
            customers…
          </div>
        ) : isError ? (
          <div className="py-14 text-center text-[13px] text-[#4B5563]">
            Couldn't load the customers.{' '}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[#2196F3] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-[#6B7280]">
            {search.trim() ? (
              'No customers match this search.'
            ) : (
              <>
                <p className="text-[15px] font-medium text-[#424242]">
                  No customers yet
                </p>
                <p className="mt-1">
                  Use “Move to customers” on a won lead, or add one by hand.
                </p>
              </>
            )}
          </div>
        ) : (
          <GenericTable<Customer>
            data={customers}
            columns={columns}
            paginationOff
            onRowClick={(customer) => setForm({mode: 'edit', customer})}
          />
        )}

        {total > 0 && (
          <div className="flex items-center justify-between gap-3 text-[13px] text-[#424242]">
            <span>
              {firstRow}–{lastRow} of {total.toLocaleString('en-IN')}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded p-1.5 hover:bg-[#F3F4F6] disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="rounded p-1.5 hover:bg-[#F3F4F6] disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {form && (
        <CustomerFormModal
          key={form.mode === 'edit' ? form.customer.id : 'new'}
          title={form.mode === 'edit' ? 'Edit customer' : 'Add customer'}
          initial={form.mode === 'edit' ? form.customer : undefined}
          submitting={createCustomer.isPending || updateCustomer.isPending}
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete customer?"
        message={
          <>
            Delete{' '}
            <span className="font-semibold text-[#212121]">
              {deleteTarget?.fullname || 'this customer'}
            </span>
            ? Their lead (if any) is kept.
          </>
        }
        busy={deleteCustomer.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteCustomer.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

const CUSTOMER_FIELDS: {
  key: keyof Required<CustomerInput>;
  label: string;
  type: 'text' | 'tel' | 'email' | 'multiline';
  required?: boolean;
}[] = [
  {key: 'fullname', label: 'Full name', type: 'text', required: true},
  {key: 'phoneNumber', label: 'Phone', type: 'tel', required: true},
  {key: 'secondaryPhoneNumber', label: 'Other phone', type: 'tel'},
  {key: 'email', label: 'Email', type: 'email'},
  {key: 'company', label: 'Company', type: 'text'},
  {key: 'address', label: 'Address', type: 'multiline'},
  {key: 'notes', label: 'Notes', type: 'multiline'},
];

type CustomerText = Record<keyof Required<CustomerInput>, string>;

const CustomerFormModal: React.FC<{
  title: string;
  initial?: Customer;
  submitting: boolean;
  onSubmit: (values: CustomerInput) => void | Promise<void>;
  onClose: () => void;
}> = ({title, initial, submitting, onSubmit, onClose}) => {
  const [text, setText] = useState<CustomerText>(() =>
    CUSTOMER_FIELDS.reduce((acc, f) => {
      acc[f.key] = (initial?.[f.key] as string | null | undefined) ?? '';
      return acc;
    }, {} as CustomerText),
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitting, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    const values = CUSTOMER_FIELDS.reduce((acc, f) => {
      acc[f.key] = text[f.key].trim();
      return acc;
    }, {} as CustomerText);
    if (!values.fullname) {
      toast.error('Enter the customer’s name.');
      return;
    }
    const digits = values.phoneNumber.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      toast.error('Enter a valid phone number.');
      return;
    }
    if (values.email && !EMAIL_RE.test(values.email)) {
      toast.error("Email doesn't look like an email address.");
      return;
    }
    // New customer: only the filled-in fields. Edit: only the changed ones ('' clears a field).
    const body: CustomerInput = {};
    CUSTOMER_FIELDS.forEach(({key}) => {
      const value = values[key];
      if (initial) {
        if (value !== String(initial[key] ?? '').trim()) body[key] = value;
      } else if (value) {
        body[key] = value;
      }
    });
    if (initial && Object.keys(body).length === 0) {
      onClose();
      return;
    }
    await onSubmit(body);
  };

  const inputClass =
    'w-full px-3 py-2.5 text-sm font-medium text-[#212121] placeholder:text-[#9CA3AF] bg-transparent focus:outline-none';

  return (
    <div
      className="fixed inset-0 z-[900] flex items-center justify-center bg-black/50 p-3 font-['Roboto',Helvetica,Arial,sans-serif] sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[94vh] w-full max-w-[640px] flex-col rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[#F3F4F6] px-5 pb-3 pt-5">
          <h2 className="text-[19px] font-bold text-[#212121]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md p-1 text-[#9CA3AF] transition-colors hover:text-[#374151] disabled:opacity-50"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-3 gap-y-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
          {CUSTOMER_FIELDS.map((f) => (
            <div
              key={f.key}
              className={`relative rounded border border-[#D1D5DB] bg-white focus-within:border-[#2196F3] focus-within:ring-1 focus-within:ring-[#2196F3] ${
                f.type === 'multiline' ? 'sm:col-span-2' : ''
              }`}
            >
              <label
                htmlFor={`customer-${f.key}`}
                className="absolute -top-2.5 left-2.5 bg-white px-1 text-[11px] font-medium text-[#4B5563]"
              >
                {f.label}
                {f.required && <span className="text-rose-500"> *</span>}
              </label>
              {f.type === 'multiline' ? (
                <textarea
                  id={`customer-${f.key}`}
                  rows={2}
                  maxLength={2000}
                  value={text[f.key]}
                  onChange={(e) =>
                    setText((t) => ({...t, [f.key]: e.target.value}))
                  }
                  className={`${inputClass} min-h-[56px] resize-y`}
                />
              ) : (
                <input
                  id={`customer-${f.key}`}
                  type={f.type}
                  inputMode={
                    f.type === 'tel'
                      ? 'tel'
                      : f.type === 'email'
                        ? 'email'
                        : undefined
                  }
                  maxLength={f.type === 'tel' ? 20 : 200}
                  value={text[f.key]}
                  onChange={(e) =>
                    setText((t) => ({...t, [f.key]: e.target.value}))
                  }
                  className={inputClass}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#F3F4F6] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-[#E0E0E0] px-5 py-2.5 text-[14px] font-medium text-[#424242] transition-colors hover:bg-[#F5F5F5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-6 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[#1E88E5] disabled:opacity-70"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Saving…' : 'Save customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomersPage;
