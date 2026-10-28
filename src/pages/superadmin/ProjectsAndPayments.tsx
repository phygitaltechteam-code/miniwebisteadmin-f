import React, { useState } from 'react';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Sparkles,
  Crown,
  Download,
  Image as ImageIcon,
  MoreVertical,
  Plus,
  ExternalLink,
  CheckCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface ProjectsAndPaymentsProps {
  business: {
    id: string;
    fullname?: string;
    businessId?: string;
    phoneNumber?: string;
    email?: string;
    subscriptionStatus?: string;
    aiCredit?: number;
    madeBy?: string;
    creationDate?: string;
    categoryName?: string;
  };
  onBack: () => void;
  onEdit?: (business: any) => void;
  onDelete?: (business: any) => void;
}

export const ProjectsAndPayments: React.FC<ProjectsAndPaymentsProps> = ({
  business,
  onBack,
  onEdit,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<'projects' | 'payments'>('projects');

  // Toggle switch states
  const [digitalCardActive, setDigitalCardActive] = useState(true);
  const [greetingImageActive, setGreetingImageActive] = useState(true);
  const [greetingVideoActive, setGreetingVideoActive] = useState(true);

  const [regularFrameActive, setRegularFrameActive] = useState(true);
  const [productFrameActive, setProductFrameActive] = useState(true);
  const [politicalFrameActive, setPoliticalFrameActive] = useState(true);

  const businessSlug = (business.fullname || 'business')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const cardLink = `https://digiwebcard.in/${businessSlug}`;
  const cardNumber = business.businessId || '14687';
  const isSubscribed = business.subscriptionStatus === 'Subscribed';

  return (
    <div className="w-full space-y-4 font-['Roboto',Helvetica,Arial,sans-serif]">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-[#E0E0E0]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-1 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-[18px] font-medium text-[#212121]">Projects & Payments</h1>
        </div>

       
      </div>

      {/* Business Title & Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-[20px] font-bold text-[#212121]">
            {business.fullname || 'ASSA O LIVING'}
          </h2>

          {/* Status pill */}
          <span
            className={`px-3 py-0.5 rounded-full text-[12px] font-medium text-white ${
              isSubscribed ? 'bg-[#4CAF50]' : 'bg-[#F44336]'
            }`}
          >
            {isSubscribed ? 'Subscribed' : 'Not Subscribed'}
          </span>

          {/* AI Credits pill */}
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-purple-400 text-purple-700 text-[12px] font-medium bg-purple-50">
            <Sparkles className="w-3 h-3" />
            + {business.aiCredit ?? 0} AI Credits
          </span>
        </div>

        {/* Edit and Delete action boxes */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onEdit?.(business)}
            title="Edit Business"
            className="p-2 rounded border border-[#2196F3] text-[#2196F3] hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete?.(business)}
            title="Delete Business"
            className="p-2 rounded border border-[#F44336] text-[#F44336] hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pill Action Buttons Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => toast.success('Refill AI Credits opened')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[13px] font-medium transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Refill AI Credit
        </button>

        <button
          type="button"
          onClick={() => toast.success('Upgrade Membership dialog opened')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-[13px] font-medium transition-colors"
        >
          <Crown className="w-3.5 h-3.5 text-amber-500" />
          Upgrade
        </button>

        <button
          type="button"
          onClick={() => toast.success('Downloading greetings pack...')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[13px] font-medium transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-gray-500" />
          Download Greetings
        </button>

        <button
          type="button"
          onClick={() => toast.success('Opening AI Creations gallery')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[13px] font-medium transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
          My AI Creations
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E0E0E0] mt-3">
        <div className="flex gap-8">
          <button
            type="button"
            onClick={() => setActiveTab('projects')}
            className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'projects'
                ? 'border-[#2196F3] text-[#2196F3]'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'payments'
                ? 'border-[#2196F3] text-[#2196F3]'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Payments
          </button>
        </div>
      </div>

      {/* Tab 1: Projects Content */}
      {activeTab === 'projects' && (
        <div className="space-y-6 pt-2">
          {/* Digital Card Section */}
          <div className="space-y-2">
            <h3 className="text-[15px] font-bold text-[#212121]">Digital Card</h3>

            <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
              <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
                <thead>
                  <tr className="bg-[#2196F3] text-white border-none select-none">
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Digital Card No</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Card Link</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Creation Date</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Card Made By</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Payment status</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white">Digital card Status</th>
                    <th className="px-3 py-2.5 text-[14px] font-medium text-white text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  <tr className="hover:bg-gray-50 border-b border-[#E0E0E0]">
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">{cardNumber}</td>
                    <td className="px-3 py-2.5 text-[14px]">
                      <a
                        href={cardLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-[#2196F3] hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[200px]">{cardLink}</span>
                      </a>
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {business.creationDate || '24 Oct, 2026 (2 days ago)'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {business.madeBy || 'Ratan Chavan (8482980338)'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">
                      {isSubscribed ? 'Done' : 'Not Done'}
                    </td>
                    <td className="px-3 py-2.5 text-[14px] text-[#212121]">Active</td>
                    <td className="px-3 py-2.5 text-[14px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit?.(business)}
                          className="p-1 text-gray-600 hover:text-[#2196F3]"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toast.success('Card options')}
                          className="p-1 text-gray-600 hover:text-[#2196F3]"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Adjust Product Settings Section */}
          <div className="max-w-xl mx-auto space-y-4 pt-2">
            <div>
              <h4 className="text-[14px] font-bold text-[#212121] mb-2.5">
                Adjust product settings with force
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Change digital card active status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {digitalCardActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDigitalCardActive(!digitalCardActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        digitalCardActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          digitalCardActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Change greeting image active status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {greetingImageActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGreetingImageActive(!greetingImageActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        greetingImageActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          greetingImageActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Change greeting video active status</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {greetingVideoActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setGreetingVideoActive(!greetingVideoActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        greetingVideoActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          greetingVideoActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Frame Visibility Settings */}
            <div>
              <h4 className="text-[14px] font-bold text-[#212121] mb-2.5">
                Adjust Frame Visibility settings with force
              </h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Regular Frame</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {regularFrameActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setRegularFrameActive(!regularFrameActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        regularFrameActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          regularFrameActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Product Frame</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {productFrameActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProductFrameActive(!productFrameActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        productFrameActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          productFrameActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[14px] text-[#212121] py-1">
                  <span>Political Frame</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] font-medium text-[#4CAF50]">
                      {politicalFrameActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPoliticalFrameActive(!politicalFrameActive)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                        politicalFrameActive ? 'bg-[#2196F3]' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-0.5 ml-0.5 ${
                          politicalFrameActive ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Content */}
      {activeTab === 'payments' && (
        <div className="space-y-4 pt-2">
          <h3 className="text-[15px] font-bold text-[#212121]">Payment Records</h3>
          <div className="overflow-x-auto rounded border border-[#E0E0E0] bg-white">
            <table className="w-full text-left font-['Roboto',Helvetica,Arial,sans-serif]">
              <thead>
                <tr className="bg-[#2196F3] text-white">
                  <th className="px-3 py-2.5 text-[14px] font-medium">Invoice No</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Plan Description</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Date</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Payment Mode</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Amount</th>
                  <th className="px-3 py-2.5 text-[14px] font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                <tr className="hover:bg-gray-50 border-b border-[#E0E0E0]">
                  <td className="px-3 py-2.5 text-[14px] font-medium text-[#2196F3]">INV-2026-{cardNumber}</td>
                  <td className="px-3 py-2.5 text-[14px] text-[#212121]">Digital Card Annual Subscription</td>
                  <td className="px-3 py-2.5 text-[14px] text-[#212121]">{business.creationDate || '24 Oct, 2026'}</td>
                  <td className="px-3 py-2.5 text-[14px] text-[#212121]">Razorpay / UPI</td>
                  <td className="px-3 py-2.5 text-[14px] font-bold text-[#212121]">₹1,499</td>
                  <td className="px-3 py-2.5 text-[14px]">
                    <span className="px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#4CAF50] text-white">
                      Paid
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => toast.success('Create new project or card')}
        title="Add Project"
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-[#2196F3] hover:bg-[#1E88E5] text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default ProjectsAndPayments;
