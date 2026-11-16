import React, {Suspense, useEffect, useMemo, useRef, useState} from 'react';
import {jwtDecode} from 'jwt-decode';
import toast from 'react-hot-toast';
import {useQueryClient} from '@tanstack/react-query';
import {
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  Pencil,
  Phone,
  Plus,
  ScanLine,
  Search,
  Star,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import GenericTable, {type Column} from '@/components/Forms/Table/GenericTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import LeadFormModal from '@/components/leads/LeadFormModal';
import CardAnalyticsPanel from '@/components/leads/CardAnalyticsPanel';
import MessageTemplatesModal from '@/components/leads/MessageTemplatesModal';
import PlatformMatchBadge from '@/components/leads/PlatformMatchBadge';
import {useAuthContext} from '@/context/AuthContext';
import {getStoredAccessToken} from '@/utils/axios';
import {fetchAllLeads} from '@/lib/api/leadsApi';
import {
  apiErrorMessage,
  leadsKey,
  useCardLinks,
  useCreateLead,
  useDeleteLead,
  useDueTodayCount,
  useLeadEvents,
  useLeadTemplates,
  useLeads,
  useMoveLeadToCustomer,
  useUpdateLead,
} from '@/lib/react-query/leads';
import {exportLeads, type LeadExportFormat} from '@/lib/leads/export';
import {formatDay, localToday, utcDay} from '@/lib/leads/dates';
import {
  callNumber,
  fillTemplate,
  mailtoHref,
  telHref,
  whatsAppHref,
  whatsAppNumber,
} from '@/lib/leads/templates';
import useDebounce from '@/hooks/useDebounce';
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
  type Lead,
  type LeadInput,
  type LeadListParams,
  type LeadSource,
  type LeadStatus,
} from '@/types/lead';

// tesseract.js lives in this chunk, so it only loads when someone scans a card
const ScanCardModal = React.lazy(
  () => import('../components/leads/ScanCardModal'),
);

const PAGE_SIZE = 25;

const STATUS_TONE: Record<LeadStatus, string> = {
  NEW: 'bg-[#E3F2FD] text-[#1565C0] border-[#BBDEFB]',
  CONTACTED: 'bg-[#FFF8E1] text-[#F57F17] border-[#FFE082]',
  INTERESTED: 'bg-[#F3E5F5] text-[#6A1B9A] border-[#E1BEE7]',
  WON: 'bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]',
  LOST: 'bg-[#F5F5F5] text-[#616161] border-[#E0E0E0]',
};

const PRIORITY_TONE = [
  '',
  'text-[#1565C0]',
  'text-[#EF6C00]',
  'text-[#C62828]',
];

/** The signed-in user's name, for {my_name} and "Captured by". */
const storedFullname = (): string => {
  try {
    const raw = localStorage.getItem('token');
    if (raw && raw.startsWith('{')) {
      const parsed = JSON.parse(raw);
      const name = parsed?.user?.fullname || parsed?.data?.user?.fullname;
      if (name) return String(name);
    }
    const token = getStoredAccessToken();
    if (token)
      return String((jwtDecode(token) as {fullname?: string})?.fullname || '');
  } catch {
    /* ignore */
  }
  return '';
};

type FormState = {mode: 'add'} | {mode: 'edit'; lead: Lead} | null;

const hasValue = (v?: string | null) => !!v && v.trim() !== '';

export const LeadsPage: React.FC<{adminId?: string}> = ({adminId}) => {
  const queryClient = useQueryClient();
  const {user} = useAuthContext();
  const myName = useMemo(
    () => (user as {fullname?: string} | null)?.fullname || storedFullname(),
    [user],
  );

  // ─── Filters ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statuses, setStatuses] = useState<LeadStatus[]>([]);
  const [priority, setPriority] = useState(0);
  const [event, setEvent] = useState('');
  const [source, setSource] = useState<'' | LeadSource>('');
  const [starred, setStarred] = useState(false);
  const [dueToday, setDueToday] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(
    () => setPage(1),
    [debouncedSearch, statuses, priority, event, source, starred, dueToday],
  );

  const params: LeadListParams = useMemo(
    () => ({
      search: debouncedSearch.trim() || undefined,
      status: statuses.length ? statuses : undefined,
      priority: priority || undefined,
      event: event || undefined,
      source: source || undefined,
      starred: starred || undefined,
      dueBy: dueToday ? localToday() : undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [
      debouncedSearch,
      statuses,
      priority,
      event,
      source,
      starred,
      dueToday,
      page,
    ],
  );
  const filtersActive = !!(
    search ||
    statuses.length ||
    priority ||
    event ||
    source ||
    starred ||
    dueToday
  );
  const clearFilters = () => {
    setSearch('');
    setStatuses([]);
    setPriority(0);
    setEvent('');
    setSource('');
    setStarred(false);
    setDueToday(false);
  };

  // ─── Data ──────────────────────────────────────────────────────────────────
  const {data, isLoading, isFetching, isError, refetch} = useLeads(
    params,
    adminId,
  );
  const {data: events = []} = useLeadEvents(adminId);
  const {data: templates} = useLeadTemplates(adminId);
  // {card_link} / {review_link} in the messages
  const {data: cardLinks} = useCardLinks(adminId);
  const {data: dueCount = 0} = useDueTodayCount(adminId);
  const createLead = useCreateLead(adminId);
  const updateLead = useUpdateLead(adminId);
  const deleteLead = useDeleteLead(adminId);
  const moveToCustomer = useMoveLeadToCustomer(adminId);

  const leads = data?.leads ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const today = localToday();

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FormState>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Lead | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const onClick = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node))
        setExportOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [exportOpen]);

  const patch = (lead: Lead, input: LeadInput) =>
    updateLead.mutate({id: lead.id, input});

  const handleSubmit = async (values: LeadInput) => {
    try {
      if (form?.mode === 'edit') {
        // Saving from the form means someone has checked it
        await updateLead.mutateAsync({
          id: form.lead.id,
          input: {...values, needsReview: false},
        });
        toast.success('Lead updated');
      } else {
        await createLead.mutateAsync({
          ...values,
          source: 'MANUAL',
          capturedBy: myName || undefined,
        });
        toast.success('Lead added');
      }
      setForm(null);
    } catch {
      // The mutation already showed the error; keep the form open
    }
  };

  /** Edit form's "Move to customers": save the edits, then make the lead a customer (it becomes WON). */
  const handleMoveFromForm = async (values: LeadInput) => {
    if (form?.mode !== 'edit') return;
    try {
      await updateLead.mutateAsync({
        id: form.lead.id,
        input: {...values, needsReview: false},
      });
      await moveToCustomer.mutateAsync(form.lead.id);
      setForm(null);
    } catch {
      // The mutation already showed the error; keep the form open
    }
  };

  const handleExport = async (format: LeadExportFormat) => {
    setExportOpen(false);
    setExporting(true);
    const id = toast.loading('Preparing export…');
    try {
      const {page: _p, limit: _l, ...filters} = params;
      const all = await fetchAllLeads(filters, adminId);
      if (!all.length) {
        toast.error('No leads to export', {id});
        return;
      }
      await exportLeads(all, format, `leads-${today}`);
      toast.success(
        `Exported ${all.length} lead${all.length === 1 ? '' : 's'}`,
        {id},
      );
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Export failed'), {id});
    } finally {
      setExporting(false);
    }
  };

  const toggleStatus = (s: LeadStatus) =>
    setStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  // ─── Table ─────────────────────────────────────────────────────────────────
  const columns: Column<Lead>[] = [
    {
      header: 'Lead',
      accessor: 'name',
      className: 'min-w-[220px]',
      render: (lead) => (
        <div className="flex min-w-0 items-start gap-2">
          <button
            type="button"
            onClick={() => patch(lead, {starred: !lead.starred})}
            className="mt-0.5 shrink-0 text-[#D1D5DB] hover:text-amber-400"
            title={lead.starred ? 'Unstar' : 'Star'}
            aria-label={lead.starred ? 'Unstar lead' : 'Star lead'}
          >
            <Star
              className={`h-4 w-4 ${lead.starred ? 'fill-amber-400 text-amber-400' : ''}`}
            />
          </button>
          <div className="min-w-0">
            <p className="max-w-[260px] truncate font-medium text-[#212121]">
              {lead.name ||
                lead.company ||
                lead.mobile ||
                lead.email ||
                'Unnamed lead'}
              {lead.needsReview && (
                <span className="ml-1.5 rounded bg-amber-100 px-1.5 py-px align-middle text-[10px] font-semibold text-amber-800">
                  Check
                </span>
              )}
            </p>
            {(hasValue(lead.jobTitle) ||
              (hasValue(lead.company) && hasValue(lead.name))) && (
              <p className="max-w-[260px] truncate text-[12px] text-[#6B7280]">
                {[lead.jobTitle, lead.name ? lead.company : '']
                  .filter(hasValue)
                  .join(' · ')}
              </p>
            )}
            <div className="max-w-[260px]">
              <PlatformMatchBadge
                compact
                phone={callNumber(lead)}
                company={lead.company}
                adminId={adminId}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Contact',
      accessor: 'mobile',
      render: (lead) => (
        <div className="text-[12.5px] leading-snug">
          {callNumber(lead) && (
            <p className="whitespace-nowrap text-[#212121]">
              {callNumber(lead)}
            </p>
          )}
          {hasValue(lead.email) && (
            <p className="max-w-[200px] truncate text-[#6B7280]">
              {lead.email}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Event',
      accessor: 'event',
      render: (lead) => (
        <div className="text-[12.5px] leading-snug">
          {hasValue(lead.event) && (
            <p className="max-w-[160px] truncate text-[#212121]">
              {lead.event}
            </p>
          )}
          <p className="text-[11px] text-[#6B7280]">
            {LEAD_SOURCES.find((s) => s.value === lead.source)?.label}
          </p>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (lead) => (
        <select
          value={lead.status}
          onChange={(e) => patch(lead, {status: e.target.value as LeadStatus})}
          className={`rounded-full border px-2 py-0.5 text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[#2196F3] ${STATUS_TONE[lead.status] ?? ''}`}
          aria-label="Status"
        >
          {LEAD_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      ),
    },
    {
      header: 'Priority',
      accessor: 'priority',
      render: (lead) => (
        <span
          className={`text-[12.5px] font-medium ${PRIORITY_TONE[lead.priority] ?? ''}`}
        >
          {lead.priority ? LEAD_PRIORITIES[lead.priority]?.label : '–'}
        </span>
      ),
    },
    {
      header: 'Follow-up',
      accessor: 'followUpAt',
      render: (lead) => {
        const day = utcDay(lead.followUpAt);
        const open = lead.status !== 'WON' && lead.status !== 'LOST';
        const overdue = !!day && open && day < today;
        const due = !!day && open && day === today;
        return (
          <input
            type="date"
            value={day}
            onChange={(e) => patch(lead, {followUpAt: e.target.value || null})}
            title={day ? formatDay(day) : 'Set a follow-up date'}
            className={`rounded border bg-white px-1.5 py-0.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#2196F3] ${
              overdue
                ? 'border-rose-300 text-rose-700'
                : due
                  ? 'border-amber-300 text-amber-800'
                  : 'border-[#E0E0E0] text-[#424242]'
            }`}
            aria-label="Follow-up date"
          />
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (lead) => {
        const number = callNumber(lead);
        const wa = whatsAppNumber(lead);
        const email =
          (hasValue(lead.email) ? lead.email : lead.email2)?.trim() || '';
        const iconBtn =
          'inline-flex h-7 w-7 items-center justify-center rounded border border-[#E0E0E0] text-[#616161] transition-colors';
        return (
          <div className="flex items-center gap-1">
            {number && (
              <a
                href={telHref(number)}
                className={`${iconBtn} hover:border-[#2E7D32] hover:text-[#2E7D32]`}
                title={`Call ${number}`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
            )}
            {wa && (
              <a
                href={whatsAppHref(
                  wa,
                  templates
                    ? fillTemplate(templates.whatsapp, lead, myName, cardLinks)
                    : '',
                )}
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
                href={mailtoHref(
                  email,
                  templates
                    ? fillTemplate(
                        templates.emailSubject,
                        lead,
                        myName,
                        cardLinks,
                      )
                    : '',
                  templates
                    ? fillTemplate(templates.emailBody, lead, myName, cardLinks)
                    : '',
                )}
                className={`${iconBtn} hover:border-[#6A1B9A] hover:text-[#6A1B9A]`}
                title={`Email ${email}`}
              >
                <Mail className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              type="button"
              onClick={() => setForm({mode: 'edit', lead})}
              className={`${iconBtn} hover:border-[#2196F3] hover:text-[#2196F3]`}
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => moveToCustomer.mutate(lead.id)}
              disabled={moveToCustomer.isPending}
              className={`${iconBtn} hover:border-[#2E7D32] hover:text-[#2E7D32] disabled:opacity-50`}
              title="Move to customers (marks the lead Won)"
              aria-label="Move to customers"
            >
              {moveToCustomer.isPending &&
              moveToCustomer.variables === lead.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <UserCheck className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setDeleteTarget(lead)}
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

  const chip = (active: boolean) =>
    `inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[12.5px] font-medium transition-colors ${
      active
        ? 'border-[#2196F3] bg-[#2196F3] text-white'
        : 'border-[#E0E0E0] bg-white text-[#424242] hover:border-[#2196F3]'
    }`;
  const select =
    'rounded border border-[#E0E0E0] bg-white px-2.5 py-1.5 text-[13px] text-[#212121] focus:outline-none focus:border-[#2196F3] focus:ring-1 focus:ring-[#2196F3]';
  const toolbarBtn =
    'inline-flex items-center gap-1.5 rounded-lg border border-[#E0E0E0] bg-white px-3 py-2 text-[13px] font-medium text-[#424242] hover:bg-[#F5F5F5] disabled:opacity-60';

  const firstRow = total ? (page - 1) * PAGE_SIZE + 1 : 0;
  const lastRow = Math.min(total, (page - 1) * PAGE_SIZE + leads.length);

  return (
    <div className="mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-2 py-3 pb-16 font-['Roboto',Helvetica,Arial,sans-serif] sm:px-4 sm:py-4 lg:px-6">
      <CardAnalyticsPanel adminId={adminId} />

      <section className="shadow-xs flex flex-col gap-3 rounded-lg border border-[#E0E0E0] bg-white p-3 sm:p-4">
        {/* Title + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-[18px] font-semibold text-[#212121]">Leads</h1>
            <span className="text-[12px] text-[#6B7280]">
              {isLoading ? '' : `${total.toLocaleString('en-IN')} total`}
            </span>
            {isFetching && !isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-[#9CA3AF]" />
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setTemplatesOpen(true)}
              className={toolbarBtn}
            >
              <MessageSquareText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </button>
            <div className="relative" ref={exportRef}>
              <button
                type="button"
                onClick={() => setExportOpen((o) => !o)}
                disabled={exporting}
                className={toolbarBtn}
                aria-expanded={exportOpen}
              >
                {exporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg border border-[#E0E0E0] bg-white py-1 shadow-xl">
                  {(
                    [
                      ['xlsx', 'Excel (.xlsx)'],
                      ['csv', 'CSV (.csv)'],
                      ['vcf', 'Contacts (.vcf)'],
                    ] as const
                  ).map(([format, label]) => (
                    <button
                      key={format}
                      type="button"
                      onClick={() => handleExport(format)}
                      className="w-full px-3 py-2 text-left text-[13px] text-[#212121] hover:bg-[#F5F5F5]"
                    >
                      {label}
                    </button>
                  ))}
                  <p className="border-t border-[#F0F0F0] px-3 pb-1.5 pt-1 text-[11px] text-[#6B7280]">
                    {filtersActive
                      ? 'Exports the leads matching the filters.'
                      : 'Exports all leads.'}
                  </p>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setForm({mode: 'add'})}
              className={toolbarBtn}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#2196F3] px-3.5 py-2 text-[13px] font-medium text-white hover:bg-[#1E88E5]"
            >
              <ScanLine className="h-4 w-4" />
              Scan card
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] max-w-md flex-1">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, company, phone, email…"
                className="w-full rounded border border-[#E0E0E0] bg-white py-1.5 pl-8 pr-3 text-[13px] text-[#212121] focus:border-[#2196F3] focus:outline-none focus:ring-1 focus:ring-[#2196F3]"
              />
            </div>
            <select
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className={select}
              aria-label="Priority"
            >
              <option value={0}>Any priority</option>
              <option value={1}>Low and above</option>
              <option value={2}>Medium and above</option>
              <option value={3}>High</option>
            </select>
            <select
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              className={`${select} max-w-[200px]`}
              aria-label="Event"
            >
              <option value="">All events</option>
              {events.map((ev) => (
                <option key={ev} value={ev}>
                  {ev}
                </option>
              ))}
            </select>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as '' | LeadSource)}
              className={select}
              aria-label="Source"
            >
              <option value="">All sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setDueToday((v) => !v)}
              className={chip(dueToday)}
              aria-pressed={dueToday}
            >
              <CalendarClock className="h-3.5 w-3.5" />
              Due today
              {dueCount > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-[11px] ${dueToday ? 'bg-white/25' : 'bg-[#F44336] text-white'}`}
                >
                  {dueCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setStarred((v) => !v)}
              className={chip(starred)}
              aria-pressed={starred}
            >
              <Star className="h-3.5 w-3.5" />
              Starred
            </button>
            <span className="mx-1 h-5 w-px bg-[#E0E0E0]" />
            {LEAD_STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => toggleStatus(s.value)}
                className={chip(statuses.includes(s.value))}
                aria-pressed={statuses.includes(s.value)}
              >
                {s.label}
              </button>
            ))}
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-1 inline-flex items-center gap-1 text-[12.5px] text-[#6B7280] hover:text-[#2196F3]"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="py-16 text-center text-[13px] text-[#6B7280]">
            <Loader2 className="mr-2 inline h-5 w-5 animate-spin" /> Loading
            leads…
          </div>
        ) : isError ? (
          <div className="py-14 text-center text-[13px] text-[#4B5563]">
            Couldn't load the leads.{' '}
            <button
              type="button"
              onClick={() => refetch()}
              className="text-[#2196F3] hover:underline"
            >
              Try again
            </button>
          </div>
        ) : leads.length === 0 ? (
          <div className="py-14 text-center text-[13px] text-[#6B7280]">
            {filtersActive ? (
              'No leads match these filters.'
            ) : (
              <>
                <p className="text-[15px] font-medium text-[#424242]">
                  No leads yet
                </p>
                <p className="mt-1">
                  Scan a business card, add one by hand, or save an enquiry from
                  the bell.
                </p>
              </>
            )}
          </div>
        ) : (
          <GenericTable<Lead>
            data={leads}
            columns={columns}
            paginationOff
            onRowClick={(lead) => setForm({mode: 'edit', lead})}
          />
        )}

        {/* Server pager */}
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
        <LeadFormModal
          key={form.mode === 'edit' ? form.lead.id : 'new'}
          title={form.mode === 'edit' ? 'Edit lead' : 'Add lead'}
          initial={
            form.mode === 'edit' ? form.lead : {event: event || undefined}
          }
          events={events}
          adminId={adminId}
          submitting={
            (createLead.isPending || updateLead.isPending) &&
            !moveToCustomer.isPending
          }
          onSubmit={handleSubmit}
          onClose={() => setForm(null)}
          onMoveToCustomer={
            form.mode === 'edit' ? handleMoveFromForm : undefined
          }
          movingToCustomer={moveToCustomer.isPending}
          extra={
            form.mode === 'edit' ? <LeadMeta lead={form.lead} /> : undefined
          }
        />
      )}

      {scanOpen && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/40">
              <Loader2 className="h-7 w-7 animate-spin text-white" />
            </div>
          }
        >
          <ScanCardModal
            adminId={adminId}
            onClose={() => setScanOpen(false)}
            onSaved={() => {
              setScanOpen(false);
              queryClient.invalidateQueries({queryKey: leadsKey(adminId)});
            }}
          />
        </Suspense>
      )}

      {templatesOpen && (
        <MessageTemplatesModal
          adminId={adminId}
          myName={myName}
          onClose={() => setTemplatesOpen(false)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete lead?"
        message={
          <>
            Delete{' '}
            <span className="font-semibold text-[#212121]">
              {deleteTarget?.name || deleteTarget?.company || 'this lead'}
            </span>
            ? It is also removed from the mobile app on its next sync.
          </>
        }
        busy={deleteLead.isPending}
        onConfirm={() =>
          deleteTarget &&
          deleteLead.mutate(deleteTarget.id, {
            onSettled: () => setDeleteTarget(null),
          })
        }
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

/** Read-only details under the edit form: where the lead came from and its card photos. */
const LeadMeta: React.FC<{lead: Lead}> = ({lead}) => {
  const source = LEAD_SOURCES.find((s) => s.value === lead.source)?.label;
  const added = utcDay(lead.scannedAt || lead.createdAt);
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-[#6B7280]">
      {source && <span>Source: {source}</span>}
      {added && <span>Added: {formatDay(added)}</span>}
      {hasValue(lead.capturedBy) && <span>By: {lead.capturedBy}</span>}
      {[lead.imageFront, lead.imageBack].map(
        (src, i) =>
          src && (
            <a
              key={src}
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
              title={i ? 'Card back' : 'Card front'}
            >
              <img
                src={src}
                alt={i ? 'Card back' : 'Card front'}
                className="h-12 w-auto rounded border border-[#E0E0E0] object-cover"
              />
            </a>
          ),
      )}
    </div>
  );
};

export default LeadsPage;
