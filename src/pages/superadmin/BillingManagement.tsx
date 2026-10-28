import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Info,
  ExternalLink,
  Receipt,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BillingManagement: React.FC = () => {
  // Accordion state for 4 sections
  const [openAi, setOpenAi] = useState(true);
  const [openGreetings, setOpenGreetings] = useState(true);
  const [openPdfId, setOpenPdfId] = useState(true);
  const [openDigitalCard, setOpenDigitalCard] = useState(true);

  // Month and Year filter for Digital Business Card
  const [selectedMonth, setSelectedMonth] = useState('Sep');
  const [selectedYear, setSelectedYear] = useState('2026');

  const createdCardsSep = [
    'http://www.digiwebcard.in/ntk-wheel',
    'http://www.digiwebcard.in/ideamaster',
    'http://www.digiwebcard.in/shree-vastra-hruday',
    'http://www.digiwebcard.in/sakshi-jewellers',
    'http://www.digiwebcard.in/villa-of-india',
    'http://www.digiwebcard.in/ninad-readymix-sweets',
    'http://www.digiwebcard.in/vatsal-rent-india',
    'http://www.digiwebcard.in/atelier-technologies-atelier-solar',
    'http://www.digiwebcard.in/phoenix-solar',
  ];

  const expiredCardsSep = [
    'http://www.digiwebcard.in/pandurang-t',
    'http://www.digiwebcard.in/abhishek-fashion-house',
    'http://www.digiwebcard.in/ab-tel',
    'http://www.digiwebcard.in/nausdal-focus-to-motion',
    'http://www.digiwebcard.in/royal-dentocare',
    'http://www.digiwebcard.in/shreeram-auto',
    'http://www.digiwebcard.in/shreedurga-jewellers',
    'http://www.digiwebcard.in/bagade-neursurgical-eyecentre',
    'http://www.digiwebcard.in/jk-electricals',
    'http://www.digiwebcard.in/drkams-karb-ckacheneospiral-prhbikosaapneveusilhcqptel',
  ];

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* ─── 1. AI Credits Billing Accordion ────────────────────────────────── */}
      <div className="overflow-hidden rounded border border-[#E0E0E0] bg-white">
        <button
          type="button"
          onClick={() => setOpenAi(!openAi)}
          className="flex w-full items-center justify-between bg-[#2196F3] px-4 py-2.5 text-left text-white transition-colors hover:bg-[#1E88E5]"
        >
          <span className="text-[15px] font-medium tracking-wide">AI Credits Billing</span>
          {openAi ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </button>

        {openAi && (
          <div className="p-4 space-y-4">
           

            {/* Info Notice Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-blue-200 bg-[#E3F2FD] p-3 text-[13px]">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Info className="h-4 w-4 shrink-0 text-[#1976D2]" />
                <span>Purchase credits to allocate to your businesses.</span>
              </div>
              <button
                type="button"
                onClick={() => toast.success('Buy AI Credits dialog opened')}
                className="rounded bg-[#212121] px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white hover:bg-black uppercase transition-colors shrink-0"
              >
                BUY AI CREDITS
              </button>
            </div>

            {/* Recent AI Credit Transactions Table */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-2">
                Recent AI Credit Transactions
              </h4>
              <div className="overflow-x-auto rounded border border-[#E0E0E0]">
                <table className="w-full text-left text-[13px] font-['Roboto',Helvetica,Arial,sans-serif]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E0E0E0] text-gray-700 font-medium">
                      <th className="px-3 py-2">Bill no</th>
                      <th className="px-3 py-2">Business Name</th>
                      <th className="px-3 py-2">Added By (Role)</th>
                      <th className="px-3 py-2">Payment Status</th>
                      <th className="px-3 py-2">Payment date</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Payment Through</th>
                      <th className="px-3 py-2">Credits Added</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E0E0E0] hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-[#2196F3]">AMC_14</td>
                      <td className="px-3 py-2 font-medium text-[#212121]">ASSA O LIVING</td>
                      <td className="px-3 py-2 text-[#212121]">Ratan Chavan (SuperAdmin)</td>
                      <td className="px-3 py-2 text-[#4CAF50] font-medium">PAID</td>
                      <td className="px-3 py-2 text-[#212121]">15 Oct 2026</td>
                      <td className="px-3 py-2 text-[#212121]">free plan</td>
                      <td className="px-3 py-2 text-[#212121]">Razorpay / UPI</td>
                      <td className="px-3 py-2 text-[#212121]">50</td>
                      <td className="px-3 py-2 text-[#212121]">0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 2. Greetings Billing Accordion ─────────────────────────────────── */}
      <div className="overflow-hidden rounded border border-[#E0E0E0] bg-white">
        <button
          type="button"
          onClick={() => setOpenGreetings(!openGreetings)}
          className="flex w-full items-center justify-between bg-[#2196F3] px-4 py-2.5 text-left text-white transition-colors hover:bg-[#1E88E5]"
        >
          <span className="text-[15px] font-medium tracking-wide">Greetings Billing</span>
          {openGreetings ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </button>

        {openGreetings && (
          <div className="p-4 space-y-4">
            <div className="text-[13px] text-gray-700">
              <span className="font-medium text-[#212121]">Active Plan: </span>
              <span>Greeting Images + Video + Exclusive Post (monthly)</span>
            </div>

            {/* Warning Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-amber-200 bg-[#FFF8E1] p-3 text-[13px]">
              <div className="flex items-center gap-2 text-amber-900">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Your plan is expiring on 14 Nov, 2026.</span>
              </div>
              <button
                type="button"
                onClick={() => toast.success('Extend plan modal')}
                className="rounded bg-[#212121] px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white hover:bg-black uppercase transition-colors shrink-0"
              >
                EXTEND YOUR PLAN
              </button>
            </div>

            {/* Recent Greetings Transactions Table */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-2">
                Recent Transactions
              </h4>
              <div className="overflow-x-auto rounded border border-[#E0E0E0] max-h-56">
                <table className="w-full text-left text-[13px] font-['Roboto',Helvetica,Arial,sans-serif]">
                  <thead className="sticky top-0 bg-gray-50 border-b border-[#E0E0E0]">
                    <tr className="text-gray-700 font-medium">
                      <th className="px-3 py-2">Bill no</th>
                      <th className="px-3 py-2">Business Name</th>
                      <th className="px-3 py-2">Added By (Role)</th>
                      <th className="px-3 py-2">Payment Status</th>
                      <th className="px-3 py-2">Payment date</th>
                      <th className="px-3 py-2">Valid from - Valid to</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Payment Through</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        bill: 'AIP1367',
                        business: 'Shree Samarth Royals',
                        addedBy: 'Ratan Chavan (SuperAdmin)',
                        through: 'UPI AutoPay',
                        date: '15 Oct 2026',
                        valid: '15 Oct 2026 - 14 Nov 2026',
                        plan: 'Greeting Images + Video + Exclusive Post (monthly)',
                        amount: '1500',
                      },
                      {
                        bill: 'AIP1344',
                        business: 'Bhawani Gold and Silver',
                        addedBy: 'Ratan Chavan (SuperAdmin)',
                        through: 'Bank Transfer / NEFT',
                        date: '16 Sep 2026',
                        valid: '16 Sep 2026 - 15 Oct 2026',
                        plan: 'Greeting Images + Video + Exclusive Post (monthly)',
                        amount: '1500',
                      },
                      {
                        bill: 'AIP1323',
                        business: 'Tervaankars Classes',
                        addedBy: 'Franchise Partner (Franchise)',
                        through: 'Razorpay UPI',
                        date: '16 Aug 2026',
                        valid: '16 Aug 2026 - 15 Sep 2026',
                        plan: 'Greeting Images + Video + Exclusive Post (monthly)',
                        amount: '1500',
                      },
                      {
                        bill: 'AIP1306',
                        business: 'Maratha Entrepreneur Association',
                        addedBy: 'Ratan Chavan (SuperAdmin)',
                        through: 'UPI',
                        date: '16 Jul 2026',
                        valid: '16 Jul 2026 - 15 Aug 2026',
                        plan: 'Greeting Images + Video + Exclusive Post (monthly)',
                        amount: '1500',
                      },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-[#E0E0E0] hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-[#2196F3]">{row.bill}</td>
                        <td className="px-3 py-2 font-medium text-[#212121]">{row.business}</td>
                        <td className="px-3 py-2 text-[#212121]">{row.addedBy}</td>
                        <td className="px-3 py-2 text-[#4CAF50] font-medium">PAID</td>
                        <td className="px-3 py-2 text-[#212121]">{row.date}</td>
                        <td className="px-3 py-2 text-[#212121]">{row.valid}</td>
                        <td className="px-3 py-2 text-[#212121]">{row.plan}</td>
                        <td className="px-3 py-2 text-[#212121]">{row.through}</td>
                        <td className="px-3 py-2 font-bold text-[#212121]">{row.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. PDF Id Card Billing Accordion ───────────────────────────────── */}
      <div className="overflow-hidden rounded border border-[#E0E0E0] bg-white">
        <button
          type="button"
          onClick={() => setOpenPdfId(!openPdfId)}
          className="flex w-full items-center justify-between bg-[#2196F3] px-4 py-2.5 text-left text-white transition-colors hover:bg-[#1E88E5]"
        >
          <span className="text-[15px] font-medium tracking-wide">PDF Id Card Billing</span>
          {openPdfId ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </button>

        {openPdfId && (
          <div className="p-4 space-y-4">
            <div className="text-[13px] text-gray-700">
              <span className="font-medium text-[#212121]">Active Plan: </span>
              <span>-</span>
            </div>

            {/* Info Notice Box */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-blue-200 bg-[#E3F2FD] p-3 text-[13px]">
              <div className="flex items-center gap-2 text-[#0D47A1]">
                <Info className="h-4 w-4 shrink-0 text-[#1976D2]" />
                <span>You do not have any plan activated.</span>
              </div>
              <button
                type="button"
                onClick={() => toast.success('Activate PDF ID Card plan')}
                className="rounded bg-[#212121] px-3.5 py-1.5 text-[12px] font-medium tracking-wide text-white hover:bg-black uppercase transition-colors shrink-0"
              >
                ACTIVATE NOW
              </button>
            </div>

            {/* Recent PDF Id Card Transactions */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-2">
                Recent Transactions
              </h4>
              <div className="overflow-x-auto rounded border border-[#E0E0E0]">
                <table className="w-full text-left text-[13px] font-['Roboto',Helvetica,Arial,sans-serif]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E0E0E0] text-gray-700 font-medium">
                      <th className="px-3 py-2">Bill no</th>
                      <th className="px-3 py-2">Business Name</th>
                      <th className="px-3 py-2">Added By (Role)</th>
                      <th className="px-3 py-2">Payment Status</th>
                      <th className="px-3 py-2">Payment date</th>
                      <th className="px-3 py-2">Valid from - Valid to</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Payment Through</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-center text-gray-400">
                        No transactions recorded for PDF Id Card
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── 4. Digital Business Card Billing Accordion ──────────────────────── */}
      <div className="overflow-hidden rounded border border-[#E0E0E0] bg-white">
        <button
          type="button"
          onClick={() => setOpenDigitalCard(!openDigitalCard)}
          className="flex w-full items-center justify-between bg-[#2196F3] px-4 py-2.5 text-left text-white transition-colors hover:bg-[#1E88E5]"
        >
          <span className="text-[15px] font-medium tracking-wide">
            Digital Business Card Billing
          </span>
          {openDigitalCard ? <ChevronUp className="h-5 w-5 text-white" /> : <ChevronDown className="h-5 w-5 text-white" />}
        </button>

        {openDigitalCard && (
          <div className="p-4 space-y-5">
            {/* Outstanding Amount Header Box */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-1.5">
                Outstanding Amount
              </h4>
              <div className="rounded border border-blue-200 bg-[#E3F2FD] p-3 max-w-sm">
                <div className="text-[12px] text-gray-600">
                  Month Payment (till 30 Sep, 2026)
                </div>
                <div className="text-2xl font-bold text-[#212121] mt-1">₹0</div>
              </div>
            </div>

            {/* Recent Monthly Payment Transactions */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-2">
                Recent Monthly Payment Transactions
              </h4>

              {/* Month / Year Filters */}
              <div className="flex items-center gap-3 mb-3 text-[13px]">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">Select Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-[13px] text-[#212121] focus:border-[#2196F3] focus:outline-none"
                  >
                    <option value="Jan">Jan</option>
                    <option value="Feb">Feb</option>
                    <option value="Mar">Mar</option>
                    <option value="Apr">Apr</option>
                    <option value="May">May</option>
                    <option value="Jun">Jun</option>
                    <option value="Jul">Jul</option>
                    <option value="Aug">Aug</option>
                    <option value="Sep">Sep</option>
                    <option value="Oct">Oct</option>
                    <option value="Nov">Nov</option>
                    <option value="Dec">Dec</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-gray-600">Select Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-[13px] text-[#212121] focus:border-[#2196F3] focus:outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>
              </div>

              {/* Card Details Box (Light Blue) */}
              <div className="rounded border border-blue-200 bg-[#E3F2FD] p-3 text-[13px] space-y-2 mb-3">
                <h5 className="font-bold text-[#212121]">Card Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-gray-800">
                  <div>
                    <span className="font-medium text-gray-600">Bill No: </span>
                    <span className="font-bold text-[#212121]">M0560</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Total Cards: </span>
                    <span>25</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Total Amount (₹100 per card): </span>
                    <span className="font-bold text-[#212121]">₹2500</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Status: </span>
                    <span className="font-bold text-[#4CAF50]">PAID</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Received Date: </span>
                    <span>07 Oct 2026</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Through: </span>
                    <span>Razorpay UPI</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Added By: </span>
                    <span>Ratan Chavan (SuperAdmin)</span>
                  </div>
                </div>

                {/* Cards created in the month Sep, 2026 */}
                <div className="pt-2">
                  <div className="font-medium text-gray-700 mb-1">
                    Cards created in the month Sep, 2026
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded border border-blue-300 bg-white p-2 space-y-1">
                    <div className="font-medium text-gray-600 pb-1 border-b border-gray-100">
                      Card Link
                    </div>
                    {createdCardsSep.map((link, idx) => (
                      <div key={idx} className="text-[12px]">
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2196F3] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>{link}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Renewal Cards Details Box (Light Blue) */}
              <div className="rounded border border-blue-200 bg-[#E3F2FD] p-3 text-[13px] space-y-2">
                <h5 className="font-bold text-[#212121]">Renewal Cards Details</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-gray-800">
                  <div>
                    <span className="font-medium text-gray-600">Total Renewing Cards: </span>
                    <span>25</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Total Amount (₹100 per card): </span>
                    <span className="font-bold text-[#212121]">₹2500</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Status: </span>
                    <span className="font-bold text-[#4CAF50]">PAID</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Received Date: </span>
                    <span>07 Oct 2026</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Payment Through: </span>
                    <span>Razorpay UPI</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Role / Managed By: </span>
                    <span>SuperAdmin Area</span>
                  </div>
                </div>

                {/* Cards expired in the month Sep, 2026 */}
                <div className="pt-2">
                  <div className="font-medium text-gray-700 mb-1">
                    Cards expired in the month Sep, 2026
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded border border-blue-300 bg-white p-2 space-y-1">
                    <div className="font-medium text-gray-600 pb-1 border-b border-gray-100">
                      Card Link
                    </div>
                    {expiredCardsSep.map((link, idx) => (
                      <div key={idx} className="text-[12px]">
                        <a
                          href={link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#2196F3] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <span>{link}</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Annual Payment Transactions */}
            <div>
              <h4 className="text-[13px] font-bold text-[#212121] mb-2">
                Recent Annual Payment Transactions
              </h4>
              <div className="overflow-x-auto rounded border border-[#E0E0E0]">
                <table className="w-full text-left text-[13px] font-['Roboto',Helvetica,Arial,sans-serif]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-[#E0E0E0] text-gray-700 font-medium">
                      <th className="px-3 py-2">Bill no</th>
                      <th className="px-3 py-2">Business Name</th>
                      <th className="px-3 py-2">Added By (Role)</th>
                      <th className="px-3 py-2">Payment Status</th>
                      <th className="px-3 py-2">Payment date</th>
                      <th className="px-3 py-2">Valid from - Valid to</th>
                      <th className="px-3 py-2">Payment Through</th>
                      <th className="px-3 py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-[#E0E0E0] hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-[#2196F3]">A10</td>
                      <td className="px-3 py-2 font-medium text-[#212121]">ASSA O LIVING</td>
                      <td className="px-3 py-2 text-[#212121]">Ratan Chavan (SuperAdmin)</td>
                      <td className="px-3 py-2 text-[#4CAF50] font-medium">PAID</td>
                      <td className="px-3 py-2 text-[#212121]">06 Aug 2026</td>
                      <td className="px-3 py-2 text-[#212121]">06 Aug 2026 - 05 Aug 2027</td>
                      <td className="px-3 py-2 text-[#212121]">Net Banking / NEFT</td>
                      <td className="px-3 py-2 font-bold text-[#212121]">6000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingManagement;
