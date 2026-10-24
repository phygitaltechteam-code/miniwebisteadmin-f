/**
 * Smart AI Business Copywriting & Keywords Generator
 * Automatically crafts SEO tags, business narratives, and product descriptions
 * based on the registered enterprise name and key services.
 */

export function generateAiKeywords(
  businessName: string,
  services: string[] = []
): string[] {
  const serviceKeywords = services.flatMap((s) => [
    s.trim(),
    `${s.trim()} Solutions`,
    `Premium ${s.trim()}`,
  ]);

  const defaultPool = [
    'Trusted Vendor Network',
    'Enterprise Networking',
    'Brand Visibility & Promotion',
    'Strategic Business Growth',
    'Executive Leadership Connect',
    'Customer First Excellence',
    'B2B & B2C Partnerships',
    'Innovative Solutions',
    'Market Expansion',
    'Verified Services',
  ];

  const combined = Array.from(
    new Set([...serviceKeywords, ...defaultPool])
  ).slice(0, 10);

  return combined;
}

export function generateAiNarrative(
  businessName: string,
  services: string[] = [],
  contactName: string = ''
): string {
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

  const templates = [
    `Welcome to ${name}

${name} is a premier enterprise committed to delivering end-to-end excellence, high-precision execution, and dependable solutions. With a firm dedication to professional integrity and customer-centric values, we specialize in ${servicesList}.

Our Mission & Core Expertise:
We empower our clients by providing high-standard, compliant, and cost-effective services customized to individual and corporate requirements. From strategic planning to prompt execution, our seasoned professionals ensure uncompromising quality, complete transparency, and seamless service delivery.

Why Partner With Us?
✓ Uncompromising Quality & Verified Standards
✓ Customer-First Approach with Transparent Advisory
✓ Proven Track Record in ${topServices}
✓ Prompt, Dedicated & Scalable Support

मराठी सारांश:
${name} ही आपल्या क्षेत्रातील एक अग्रगण्य आणि विश्वासू संस्था आहे. आम्ही ग्राहकांच्या गरजा ओळखून दर्जेदार, वेळेवर आणि पारदर्शक सेवा पुरवण्यासाठी कटिबद्ध आहोत. आमच्या तज्ज्ञ टीमच्या सहकार्याने आपल्या व्यवसायाला आणि कामांना नवी दिशा द्या.

"विश्वसनीयता, उत्कृष्ट गुणवत्ता आणि ग्राहकांचे समाधान हेच आमचे अंतिम ध्येय!"`,

    `About ${name}

Established with a clear vision for excellence and innovation, ${name} stands as a trusted name in ${topServices}. We take immense pride in helping our valued clients navigate challenges through reliable solutions, technical mastery, and personalized support.

What Sets Us Apart:
Our expertise spans across ${servicesList}, crafted to cater to both emerging needs and established requirements. Guided by ethical business practices, our focus remains on building lasting relationships based on trust, efficiency, and measurable outcomes.

Key Strengths:
• Deep domain expertise in ${topServices}
• Tailored, cost-effective solutions with zero compromises on quality
• Proactive communication and seamless post-service assistance
• Commitment to total customer satisfaction and compliance

मराठी सारांश:
आमच्या संस्थेचे मुख्य ध्येय ग्राहकांना सर्वोत्तम, विश्वासार्ह आणि आधुनिक सेवा उपलब्ध करून देणे हे आहे. आपल्या प्रत्येक गरजेनुसार परिपूर्ण उपाययोजना करून आम्ही ग्राहकांचा विश्वास संपादन केला आहे.

"उत्कृष्ट सेवा, प्रामाणिक सहकार्य आणि यशाची हमी!"`,

    `Welcome to ${name} — Your Trusted Partner in Excellence

At ${name}, we believe that sustainable success is built on a foundation of reliability, skill, and genuine customer care. Specializing in ${servicesList}, we deliver tailored services designed to maximize value, ensure safety, and exceed expectations.

Our Approach:
Every client requirement is handled with meticulous attention to detail. Whether providing ${topServices} or ongoing consulting, our experienced team ensures timely delivery, verified industry standards, and effortless collaboration.

Our Core Commitments:
1. Precision & Reliability in Every Deliverable
2. Ethical, Transparent & Fair Practices
3. Dedicated Assistance & End-to-End Guidance

मराठी सारांश:
${name} कडून आपल्याला मिळतात खात्रीशीर, दर्जेदार आणि परवडणाऱ्या सेवा. ग्राहकांच्या समाधानाला सर्वोच्च प्राधान्य देत आम्ही अविरत कार्यरत आहोत.

"एकत्र वाढूया, एकत्र प्रगती करूया!"`,

    `About ${name}

${name} is dedicated to setting new benchmarks in quality, professionalism, and client satisfaction. As a trusted partner for ${servicesList}, we blend deep domain knowledge with an agile, responsive workflow to provide standout results for clients across the region.

Our Service Philosophy:
We view every client engagement as a long-term partnership. By listening closely to your goals and delivering dependable solutions in ${topServices}, we make your journey smooth, predictable, and rewarding.

What We Offer:
✦ End-to-End Solutions in ${topServices}
✦ Certified Standards, Compliance & Expert Supervision
✦ Flexible, Customized Packages Suited to Your Budget
✦ Prompt Turnaround & Continuous Support

मराठी सारांश:
आम्ही आपल्या विश्वासाला पात्र ठरणाऱ्या दर्जेदार आणि वेळेवर सेवा देण्यासाठी सदैव तत्पर आहोत. व्यवसाय वृद्धी आणि कार्यक्षम सेवेसाठी आजच आमच्याशी संपर्क साधा.

"विश्वास, गुणवत्ता आणि प्रगतीची नवी दिशा!"`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
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
      match: /(software|tech|it\b|information technology|web|app\b|cloud|developer|coding|cyber|data|computer)/i,
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
      match: /(auto|car|bike|motor|vehicle|garage|service center|tyre|battery|mechanic|dealership)/i,
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

  // 2. If categories didn't yield enough, check businessName
  if (servicePool.length < 4 && businessText) {
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

  // Deduplicate and return top 6
  return Array.from(new Set(servicePool)).slice(0, 6);
}
