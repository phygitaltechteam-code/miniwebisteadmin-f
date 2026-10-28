import React, { useState } from 'react';
import {
  Image as ImageIcon,
  Sparkles,
  Download,
  Share2,
  Calendar,
  Filter,
  Plus,
  CheckCircle,
} from 'lucide-react';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import toast from 'react-hot-toast';

export const GreetingsManagement: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const greetingTemplates = [
    {
      id: 1,
      title: 'Diwali Festival Greetings',
      category: 'Festivals',
      date: 'Autumn Special',
      badge: 'POPULAR',
      gradient: 'from-amber-500 via-orange-500 to-rose-600',
      description: 'Golden luxury lanterns with custom business name & contact banner.',
      downloads: 412,
    },
    {
      id: 2,
      title: 'Happy New Year 2027',
      category: 'New Year',
      date: 'Upcoming Season',
      badge: 'FEATURED',
      gradient: 'from-blue-600 via-indigo-600 to-purple-700',
      description: 'Futuristic fireworks celebration card with personalized greetings.',
      downloads: 380,
    },
    {
      id: 3,
      title: 'Independence Day Tribute',
      category: 'National',
      date: 'August 15',
      badge: 'PATRIOTIC',
      gradient: 'from-orange-500 via-white to-emerald-600 text-slate-800',
      description: 'Tri-color corporate greeting with business logo placement.',
      downloads: 295,
    },
    {
      id: 4,
      title: 'Eid Mubarak Greetings',
      category: 'Festivals',
      date: 'Festival Season',
      badge: 'ELEGANT',
      gradient: 'from-emerald-600 via-teal-700 to-slate-900',
      description: 'Crescent moon with emerald calligraphy & customized footer.',
      downloads: 310,
    },
    {
      id: 5,
      title: 'Merry Christmas Wishes',
      category: 'Festivals',
      date: 'December 25',
      badge: 'SEASONAL',
      gradient: 'from-red-600 via-rose-700 to-emerald-800',
      description: 'Festive red & green pine theme with warm corporate regards.',
      downloads: 198,
    },
    {
      id: 6,
      title: 'Monday Motivation Quote',
      category: 'Motivational',
      date: 'Weekly Special',
      badge: 'BUSINESS',
      gradient: 'from-slate-800 via-indigo-900 to-slate-950',
      description: 'High converting motivational quote with company branding.',
      downloads: 520,
    },
  ];

  const categories = ['all', 'Festivals', 'New Year', 'National', 'Motivational'];

  const filtered = greetingTemplates.filter(
    (t) => selectedCategory === 'all' || t.category === selectedCategory
  );

  const handleDownload = (title: string) => {
    toast.success(`Greeting card "${title}" downloaded!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-pink-600" />
            Greetings Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Festive cards, holiday banners, and business promotional templates for cards
          </p>
        </div>

        <GenericButton
          onClick={() => toast.success('Template upload studio opened')}
          className="!px-4 !py-2.5 !text-xs font-bold !bg-pink-600 hover:!bg-pink-500 shadow-md shadow-pink-600/25"
        >
          <Plus className="w-4 h-4 mr-1 inline" />
          Upload New Greeting
        </GenericButton>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setSelectedCategory(c)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedCategory === c
                ? 'bg-pink-600 text-white shadow-sm'
                : 'bg-white border border-stroke text-slate-600 hover:bg-slate-50'
            }`}
          >
            {c === 'all' ? 'All Greetings' : c}
          </button>
        ))}
      </div>

      {/* Greetings Template Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-stroke bg-white shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-200"
          >
            {/* Visual Header / Banner */}
            <div
              className={`h-40 bg-gradient-to-br ${item.gradient} p-4 flex flex-col justify-between text-white relative`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm uppercase">
                  {item.badge}
                </span>
                <span className="text-[11px] font-semibold text-white/80 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {item.date}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black tracking-tight drop-shadow-sm">
                  {item.title}
                </h3>
                <span className="text-xs text-white/80 font-medium">
                  {item.category}
                </span>
              </div>
            </div>

            {/* Card Content & Action */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-600 leading-relaxed">
                {item.description}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-gray-500">
                <span>{item.downloads} businesses shared</span>
                <button
                  type="button"
                  onClick={() => handleDownload(item.title)}
                  className="flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-800 p-1.5 rounded-lg hover:bg-pink-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GreetingsManagement;
