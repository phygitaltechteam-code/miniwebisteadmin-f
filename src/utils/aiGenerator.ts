/**
 * Smart AI Business Copywriting & Keywords Generator
 * Automatically crafts SEO tags, business narratives, and product descriptions
 * based on the registered enterprise name and key services.
 */

import { htmlToText } from '@/utils/richText';

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pass the currently shown keywords as `previous` so every regenerate
 * returns a fresh set (unused keywords are preferred first).
 */
export function generateAiKeywords(
  businessName: string,
  services: string[] = [],
  previous: string[] = []
): string[] {
  // Natural search-style phrases, the way people actually look for a service
  // Lowercase ordinary words inside a phrase, keep acronyms (CRM, SMS, UI/UX)
  const lower = (s: string) => s.split(' ').map((w) => (/^[A-Z0-9/&]+$/.test(w) ? w : w.toLowerCase())).join(' ');
  const servicePatterns = [
    (s: string) => s,
    (s: string) => `${s} services`,
    (s: string) => `${s} near me`,
    (s: string) => `Affordable ${lower(s)}`,
    (s: string) => `${s} experts`,
    (s: string) => `Trusted ${lower(s)} provider`,
    (s: string) => `${s} for small business`,
    (s: string) => `${s} company`,
  ];

  const serviceKeywords = services
    .map((s) => s.trim())
    .filter(Boolean)
    .flatMap((s) => servicePatterns.map((fn) => fn(s)));

  const defaultPool = [
    'Quick response',
    'Transparent pricing',
    'Experienced team',
    'On-time delivery',
    'Friendly customer support',
    'Quality work',
    'Value for money',
    'Customised solutions',
    'After-sales support',
    'Trusted by local businesses',
  ];

  const pool = Array.from(new Set([...serviceKeywords, ...defaultPool]));
  const prevSet = new Set(previous.map((p) => String(p).toLowerCase()));

  // Keep a few service keywords so tags stay relevant, then fill with the rest
  const fresh = shuffle(pool.filter((k) => !prevSet.has(k.toLowerCase())));
  const used = shuffle(pool.filter((k) => prevSet.has(k.toLowerCase())));
  const freshService = fresh.filter((k) => serviceKeywords.includes(k));
  const freshOther = fresh.filter((k) => !serviceKeywords.includes(k));

  const picked = [
    ...freshService.slice(0, 5),
    ...freshOther,
    ...freshService.slice(5),
    ...used,
  ].slice(0, 10);

  return shuffle(picked);
}

/** The stock About Us templates for this business (also used to tell generated text from user-written text) */
export function narrativeTemplates(businessName: string, services: string[] = []): string[] {
  const name = businessName.trim() || 'Our Enterprise';
  const cleanServices = services
    .map((s) => (typeof s === 'object' ? String((s as any).businessNature || (s as any).name || '') : String(s)))
    .map((s) => s.trim())
    .filter(Boolean);

  const servicesList =
    cleanServices.length > 0
      ? cleanServices.join(', ')
      : 'professional business solutions, customer care, and quality services';

  const topServices =
    cleanServices.length > 0
      ? cleanServices.slice(0, 3).join(' and ')
      : 'our specialized offerings';

  return [
    `Welcome to ${name}

${name} is a premier enterprise committed to delivering end-to-end excellence, high-precision execution, and dependable solutions. With a firm dedication to professional integrity and customer-centric values, we specialize in ${servicesList}.

Our Mission & Core Expertise:
We empower our clients by providing high-standard, compliant, and cost-effective services customized to individual and corporate requirements. From strategic planning to prompt execution, our seasoned professionals ensure uncompromising quality, complete transparency, and seamless service delivery.

Why Partner With Us?
✓ Uncompromising Quality & Verified Standards
✓ Customer-First Approach with Transparent Advisory
✓ Proven Track Record in ${topServices}
✓ Prompt, Dedicated & Scalable Support

"Reliability, excellent quality and customer satisfaction are our ultimate goals!"`,

    `About ${name}

Established with a clear vision for excellence and innovation, ${name} stands as a trusted name in ${topServices}. We take immense pride in helping our valued clients navigate challenges through reliable solutions, technical mastery, and personalized support.

What Sets Us Apart:
Our expertise spans across ${servicesList}, crafted to cater to both emerging needs and established requirements. Guided by ethical business practices, our focus remains on building lasting relationships based on trust, efficiency, and measurable outcomes.

Key Strengths:
• Deep domain expertise in ${topServices}
• Tailored, cost-effective solutions with zero compromises on quality
• Proactive communication and seamless post-service assistance
• Commitment to total customer satisfaction and compliance

"Excellent service, honest cooperation and a guarantee of success!"`,

    `Welcome to ${name} — Your Trusted Partner in Excellence

At ${name}, we believe that sustainable success is built on a foundation of reliability, skill, and genuine customer care. Specializing in ${servicesList}, we deliver tailored services designed to maximize value, ensure safety, and exceed expectations.

Our Approach:
Every client requirement is handled with meticulous attention to detail. Whether providing ${topServices} or ongoing consulting, our experienced team ensures timely delivery, verified industry standards, and effortless collaboration.

Our Core Commitments:
1. Precision & Reliability in Every Deliverable
2. Ethical, Transparent & Fair Practices
3. Dedicated Assistance & End-to-End Guidance

"Let's grow together, let's progress together!"`,

    `About ${name}

${name} is dedicated to setting new benchmarks in quality, professionalism, and client satisfaction. As a trusted partner for ${servicesList}, we blend deep domain knowledge with an agile, responsive workflow to provide standout results for clients across the region.

Our Service Philosophy:
We view every client engagement as a long-term partnership. By listening closely to your goals and delivering dependable solutions in ${topServices}, we make your journey smooth, predictable, and rewarding.

What We Offer:
✦ End-to-End Solutions in ${topServices}
✦ Certified Standards, Compliance & Expert Supervision
✦ Flexible, Customized Packages Suited to Your Budget
✦ Prompt Turnaround & Continuous Support

"A new direction of trust, quality and progress!"`,
  ];
}

export function generateAiNarrative(
  businessName: string,
  services: string[] = [],
  contactName: string = '',
  previous: string = ''
): string {
  const templates = narrativeTemplates(businessName, services);

  // Never return the narrative that is currently shown
  const options = templates.filter((t) => t.trim() !== previous.trim());
  const pickFrom = options.length > 0 ? options : templates;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

/** Tidy user-written text: one sentence per item, capitalised, ending with punctuation */
function polishSentences(text: string): string[] {
  return htmlToText(text)
    .replace(/\s+([,.!?])/g, '$1')
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const fixed = s.replace(/\bi\b/g, 'I').replace(/,(?=\S)/g, ', ');
      const capped = fixed.charAt(0).toUpperCase() + fixed.slice(1);
      return /[.!?]$/.test(capped) ? capped : `${capped}.`;
    });
}

/**
 * Regenerate About Us text from what the user typed: their content is polished and
 * placed in a professional layout with the business name and services around it.
 * Pass the currently shown narrative as `previous` so every click gives a new variant.
 */
export function generateAiNarrativeFromText(
  businessName: string,
  services: string[] = [],
  userText: string = '',
  previous: string = ''
): string {
  const name = businessName.trim() || 'Our Enterprise';
  const sentences = polishSentences(userText);
  if (sentences.length === 0) return generateAiNarrative(businessName, services, '', previous);

  // Short texts stay one paragraph; longer ones are split into an intro and the rest
  const intro = sentences.slice(0, 2).join(' ');
  const rest = sentences.slice(2).join(' ');
  const story = rest ? `${intro}\n\n${rest}` : intro;

  const cleanServices = services
    .map((s) => (typeof s === 'object' ? String((s as any).businessNature || (s as any).name || '') : String(s)))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const offer = (heading: string, mark: string) =>
    cleanServices.length > 0 ? `\n\n${heading}\n${cleanServices.map((s) => `${mark} ${s}`).join('\n')}` : '';

  const templates = [
    `About ${name}

${story}${offer('What We Offer:', '✓')}

"Reliability, excellent quality and customer satisfaction are our ultimate goals!"`,

    `Welcome to ${name}

${story}

Why Choose Us?
• Honest, transparent and customer-first service
• Experienced team with attention to detail
• Prompt support from start to finish${offer('Our Key Services:', '•')}`,

    `${name} — Your Trusted Partner

${story}${offer('Our Expertise:', '✦')}

We look forward to serving you and building a lasting relationship based on trust and quality.`,

    `Who We Are

${story}

At ${name}, every client matters. We combine skill, care and fair pricing to deliver results you can rely on.${offer('Services:', '✓')}

"Let's grow together, let's progress together!"`,
  ];

  const options = templates.filter((t) => htmlToText(t) !== htmlToText(previous));
  const pickFrom = options.length > 0 ? options : templates;
  return pickFrom[Math.floor(Math.random() * pickFrom.length)];
}

export function generateProductDescription(
  productTitle: string,
  businessName: string
): string {
  const title = productTitle.trim() || 'Service Package';
  const bName = businessName.trim() || 'our company';

  const descriptions = [
    `Comprehensive and tailored ${title} provided by ${bName}. Designed for high performance, verified standards, and complete customer satisfaction. Includes dedicated customer support, streamlined onboarding, and enterprise-grade deliverables.`,
    `Premium ${title} from ${bName}. Built with attention to detail and industry-best practices to maximize value and efficiency for your business. Fast turnaround and guaranteed satisfaction.`,
    `Professional ${title} curated by ${bName}. Trusted by top businesses for consistency, reliability, and competitive pricing. Contact us today for personalized consulting and seamless execution.`,
    `Experience top-tier ${title} with ${bName}. We combine technical expertise with customer-centric service to deliver measurable results and dependable quality.`
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

/**
 * Smart Category & Business Sector Key Services Generator
 * Generates curated, high-impact key services based on selected business categories,
 * business natures, and company name.
 */
export function generateAiServices(
  categories: string[] = [],
  businessName: string = '',
  existingNatures: string[] = []
): string[] {
  const categoryText = categories.filter(Boolean).join(' ').toLowerCase();
  const businessText = (businessName || '').toLowerCase();
  const combinedText = `${categoryText} ${businessText}`.trim();

  const servicePool: string[] = [];

  const industryMap: Array<{ match: RegExp; services: string[] }> = [
    {
      match: /(digital services|digital card|business card|mini website|website|online presence|automation|whatsapp|\bsms\b|\bcrm\b|software solutions|it services)/i,
      services: [
        'Digital Business Cards',
        'Mini Website Design',
        'WhatsApp & SMS Automation',
        'CRM & Lead Management',
        'Google Business Profile Management',
        'Online Review Management',
        'Social Media Marketing',
      ],
    },
    {
      match: /(electrical|electrician|wiring|switchboard|lighting installation|electrical repair|mcb|fuse|power backup)/i,
      services: [
        'Residential & Commercial Electrical Wiring',
        'Electrical Maintenance & Troubleshooting',
        'Switchboard & MCB Fuse Installation',
        'LED & Architectural Lighting Fitting',
        'Home & Industrial Appliance Servicing',
        'Inverter & Power Backup Setup',
      ],
    },
    {
      match: /(plumbing|plumber|sanitary|drainage|water pipe|leakage|geyser repair)/i,
      services: [
        'Pipe Fitting & Leak Repair',
        'Bathroom & Kitchen Sanitary Installation',
        'Drainage & Sewage Blockage Removal',
        'Water Tank & Motor Installation',
        'Geyser & Water Heater Servicing',
        'Waterproofing & Pipe Maintenance',
      ],
    },
    {
      match: /(carpenter|carpentry|furniture|woodwork|modular kitchen|wardrobe|cabinet)/i,
      services: [
        'Custom Furniture Design & Fabrication',
        'Modular Kitchen & Wardrobe Installation',
        'Door, Window & Lock Repair',
        'Wood Polishing & Refurbishment',
        'Office Workstation Setup',
        'Interior Wood Paneling & Partitions',
      ],
    },
    {
      match: /(painting|painter|whitewash|waterproofing|wall texture|distemper)/i,
      services: [
        'Interior & Exterior Wall Painting',
        'Waterproof Wall & Roof Coating',
        'Texture Painting & Stencil Designs',
        'Wood & Metal Enamel Polishing',
        'Crack Repair & Surface Priming',
        'Commercial Building Repainting',
      ],
    },
    {
      match: /(software|\btech|\bit\b|information technology|\bweb\b|\bapps?\b|cloud|developer|coding|cyber|\bdata\b|computer)/i,
      services: [
        'Custom Software Development',
        'Web & Mobile App Development',
        'Cloud Solutions & DevOps',
        'Cybersecurity & Data Protection',
        'UI/UX Design & Prototyping',
        'IT Support & Maintenance',
      ],
    },
    {
      match: /(real estate|property|builder|construction|realty|housing|infrastructure|interior|architect|civil)/i,
      services: [
        'Residential & Commercial Sales',
        'Property Leasing & Rentals',
        'Real Estate Investment Advisory',
        'Turnkey Construction & Planning',
        'Interior Design & Space Renovation',
        'Property Documentation & Legal Verification',
      ],
    },
    {
      match: /(health|hospital|clinic|doctor|medical|pharma|dental|nursing|healthcare|diagnostic|pathology)/i,
      services: [
        'General & Specialist Consultations',
        'Comprehensive Health Checkups',
        'Diagnostic & Pathology Testing',
        'Preventive Healthcare Programs',
        'Emergency & Outpatient Care',
        'Digital Health & Teleconsultation',
      ],
    },
    {
      match: /(finance|accounting|tax|gst|audit|ca\b|banking|loan|wealth|investment|insurance)/i,
      services: [
        'Tax Planning & GST Compliance',
        'Auditing & Financial Compliance',
        'Corporate Accounting & Bookkeeping',
        'Business Loan & Funding Advisory',
        'Wealth Management & Investment Planning',
        'Company Incorporation & ROC Filing',
      ],
    },
    {
      match: /(legal|law|advocate|attorney|solicitor|court|compliance|trademark|patent|ipr)/i,
      services: [
        'Corporate & Business Legal Advisory',
        'Contract Drafting & Legal Vetting',
        'Trademark & IP Registration',
        'Civil & Commercial Litigation',
        'Statutory & Regulatory Compliance',
        'Dispute Resolution & Arbitration',
      ],
    },
    {
      match: /(food|restaurant|cafe|catering|caterer|bakery|dining|hotel|hospitality|kitchen|sweet|tiffin)/i,
      services: [
        'Fine Dining & Gourmet Experience',
        'Corporate & Wedding Catering',
        'Custom Buffet & Event Menus',
        'Quick Delivery & Takeaway',
        'Specialty Bakery & Confectionery',
        'Private Event Space Hosting',
      ],
    },
    {
      match: /(education|school|college|academy|coaching|training|institute|tuition|tutor|learning|classes)/i,
      services: [
        'Professional Certification Courses',
        'Skill Development & Bootcamp Training',
        'Competitive Exam Coaching',
        'One-on-One Mentorship & Guidance',
        'Corporate Workforce Workshops',
        'Interactive E-Learning Programs',
      ],
    },
    {
      match: /(marketing|advertising|digital marketing|seo|social media|branding|creative agency|pr\b|media)/i,
      services: [
        'Search Engine Optimization (SEO)',
        'Social Media Growth & Marketing',
        'Performance Ads & PPC Management',
        'Brand Identity & Logo Design',
        'Content Strategy & Copywriting',
        'Influencer Marketing & PR Campaigns',
      ],
    },
    {
      match: /(manufacturing|industrial|factory|fabrication|machining|engineering|metal|oem|production)/i,
      services: [
        'Precision Engineering & Machining',
        'Custom Sheet Metal Fabrication',
        'OEM & Bulk Component Production',
        'Quality Assurance & Inspection',
        'Industrial Equipment Assembly',
        'Custom Prototype Development',
      ],
    },
    {
      match: /(\bauto(mobile|motive)?s?\b|\bcars?\b|\bbikes?\b|motorcycle|two wheeler|four wheeler|vehicle|garage|tyre|car battery|mechanic|dealership)/i,
      services: [
        'Periodic Vehicle Servicing & Tuning',
        'Engine Diagnostics & Mechanical Repair',
        'Bodywork, Denting & Painting',
        'Wheel Alignment & Balancing',
        'Genuine Spare Parts & Accessories',
        'Emergency Roadside Assistance',
      ],
    },
    {
      match: /(logistics|transport|courier|freight|cargo|shipping|supply chain|warehouse|packers)/i,
      services: [
        'Express Courier & Parcel Delivery',
        'Domestic & International Freight',
        'Warehousing & Inventory Management',
        'Fleet Transport & Goods Shifting',
        'Real-time Consignment Tracking',
        'Customs Clearance & Documentation',
      ],
    },
    {
      match: /(travel|tourism|tour|trip|holiday|visa|flight|resort|hotel)/i,
      services: [
        'Customized Holiday Packages',
        'Corporate Travel Management',
        'Flight & Hotel Bookings',
        'Visa Assistance & Travel Insurance',
        'Guided Sightseeing & Transfers',
        'Group Excursions & Weekend Getaways',
      ],
    },
    {
      match: /(salon|spa|beauty|parlour|hair|makeup|grooming|massage|cosmetic)/i,
      services: [
        'Advanced Hair Styling & Color Care',
        'Facial & Skin Rejuvenation Therapy',
        'Bridal & Event Makeup Artistry',
        'Relaxing Aromatherapy & Spa',
        'Nail Art & Manicure-Pedicure',
        'Personal Grooming Packages',
      ],
    },
    {
      match: /(fitness|gym|yoga|crossfit|trainer|workout|nutrition)/i,
      services: [
        'Personalized Fitness Training',
        'Custom Nutrition & Diet Plans',
        'Cardio & Strength Conditioning',
        'Yoga & Mindfulness Sessions',
        'Group Aerobics & HIIT Classes',
        'Body Composition & Progress Tracking',
      ],
    },
    {
      match: /(cleaning|housekeeping|facility|pest control|sanitization)/i,
      services: [
        'Deep Home & Office Cleaning',
        'Commercial Facility Management',
        'Targeted Pest Control Treatments',
        'Sanitization & Disinfection',
        'Sofa & Carpet Upholstery Cleaning',
        'Move-in & Move-out Cleaning',
      ],
    },
    {
      match: /(security|cctv|surveillance|guard)/i,
      services: [
        'CCTV & Video Surveillance Setup',
        'Trained Security Guard Deployment',
        'Biometric & Access Control Systems',
        'Fire Alarm & Security Monitoring',
        'Residential Society Security',
        'Event Bouncer & Guard Services',
      ],
    },
    {
      match: /(event|wedding|photographer|videography|studio|film|planner|decoration)/i,
      services: [
        'Wedding & Corporate Photography',
        'Cinematic Video Production',
        'Pre-Wedding & Portrait Shoots',
        'End-to-End Event Planning & Decor',
        'Drone Aerial Videography',
        'Studio Lighting & Photo Editing',
      ],
    },
    {
      match: /(consulting|consultant|advisory|management|strategy|hr\b|recruitment|staffing)/i,
      services: [
        'Strategic Business Planning',
        'Operations & Process Optimization',
        'Executive Search & Recruitment',
        'HR Policy & Payroll Management',
        'Market Research & Feasibility Analysis',
        'Change Management & Growth Strategy',
      ],
    },
    {
      match: /(retail|shop|store|fashion|clothing|garment|jewel|apparel|wholesale|supermarket|textile|boutique)/i,
      services: [
        'Premium Retail Merchandise',
        'Custom Tailoring & Design',
        'Bulk Wholesale Distribution',
        'Corporate Gifting Collections',
        'Prompt Home Delivery',
        'Customer Loyalty & Warranty Support',
      ],
    },
    {
      match: /(jewellery|jewelry|gold|silver|diamond|ornament)/i,
      services: [
        'Hallmarked Gold & Silver Jewellery',
        'Certified Diamond Ornaments',
        'Custom Jewellery Design & Making',
        'Bridal Jewellery Collections',
        'Jewellery Polishing & Repair',
        'Gold Exchange & Valuation',
      ],
    },
    {
      match: /(agriculture|agro|farming|seed|fertilizer|irrigation|crop|organic|dairy)/i,
      services: [
        'High-Yield Seeds & Fertilizer Supply',
        'Modern Drip Irrigation Solutions',
        'Soil Health Testing & Crop Advisory',
        'Agricultural Equipment Hire',
        'Post-Harvest Cold Storage',
        'Organic Farming Consultation',
      ],
    },
    {
      match: /(solar|renewable energy|photovoltaic|solar panel|solar inverter|solar epc|clean energy)/i,
      services: [
        'Rooftop Solar Panel Installation',
        'Industrial Solar Energy Solutions',
        'Solar Inverter & Battery Maintenance',
        'Energy Audit & Efficiency Consulting',
        'Government Subsidy & Net Metering Support',
        'Solar EPC Project Management',
      ],
    },
  ];

  // 1. First, check if any category directly matches our industry map
  if (categoryText) {
    industryMap.forEach(({ match, services }) => {
      if (match.test(categoryText)) {
        servicePool.push(...services);
      }
    });
  }

  // 2. Only when the categories match nothing, look at the business name
  if (servicePool.length === 0 && businessText) {
    industryMap.forEach(({ match, services }) => {
      if (match.test(businessText)) {
        servicePool.push(...services);
      }
    });
  }

  // 3. If combined inputs match anything else
  if (servicePool.length === 0 && combinedText) {
    industryMap.forEach(({ match, services }) => {
      if (match.test(combinedText)) {
        servicePool.push(...services);
      }
    });
  }

  // 4. Synthesize professional services if custom category was entered
  if (servicePool.length === 0 && categories.length > 0) {
    categories.forEach((cat) => {
      const trimmed = cat.trim();
      if (!trimmed) return;
      servicePool.push(
        `${trimmed} Installation & Setup`,
        `${trimmed} Maintenance & Repair`,
        `Commercial ${trimmed} Solutions`,
        `Residential ${trimmed} Services`,
        `Emergency ${trimmed} Support`
      );
    });
  }

  // 5. Default fallback if nothing matched
  if (servicePool.length === 0) {
    const fallbackName = businessName.trim() || 'Enterprise';
    servicePool.push(
      `${fallbackName} Client Solutions`,
      'Strategic Business Consulting',
      'End-to-End Project Execution',
      'Quality Assurance & Support',
      'Custom Delivery & Partnership'
    );
  }

  // Deduplicate and return proportional to number of selected categories
  const limit = Math.max(6, Math.min(15, (categories.length || 1) * 5));
  return Array.from(new Set(servicePool)).slice(0, limit);
}
