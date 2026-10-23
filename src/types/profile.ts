import { PortalThemeId } from './theme';

export interface ProductItem {
  id: string | number;
  _id?: string;
  name?: string;
  title: string;
  description?: string;
  price?: string | number;
  currency?: string;
  currencyInfo?: string;
  priority?: string;
  status?: 'Active' | 'Coming Soon' | 'Draft';
  image?: string;
  imageFile?: File;
  isHideEnquiry?: boolean;
  hideEnquiry?: boolean;
  isHideDownloadProductCart?: boolean;
  hideDownload?: boolean;
  removeImage?: boolean;
  customiseMessage?: boolean;
  customEnquiryMessage?: string;
}

export interface QuickLink {
  id: string;
  name: string;
  added: boolean;
  colorClass?: string;
  value?: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export interface CustomerEnquiry {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  serviceRequested: string;
  message: string;
  createdAt: string;
  status: 'New' | 'In Progress' | 'Completed';
}

export interface CompanyDocument {
  id: string;
  name: string;
  fileName?: string;
  url: string;
  size?: string;
  uploadedAt?: string;
  type?: string;
  file?: File;
}

export interface GalleryImage {
  id: string;
  url: string;
  image?: string;
  title: string;
  description?: string;
  alt?: string;
  file?: File;
}

export interface YoutubeVideo {
  id: string;
  title: string;
  url: string;
  link?: string;
  videoUrl?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
}

export interface ProfileData {
  // Step 1: Basic Details & Theme & Location
  theme: PortalThemeId | 'clean-white' | 'white-orange' | 'white-minimal' | 'white-emerald' | 'white-royal' | 'dark-gold' | 'royal-blue' | 'emerald-luxe' | string;
  category: string;
  categories: string[];
  servicesOffered: string[];
  businessName: string;
  vanityUrl: string;
  isUrlAvailable: boolean;
  hasGoldenBorder: boolean;
  logoUrl: string;
  bannerUrl: string;
  prefix: string;
  contactName: string;
  designation: string;
  primaryPhone: string;
  whatsappPhone: string;
  whatsappNumber?: string;
  categoryId?: string;
  categoryName?: string;
  categoryNames?: string[];
  categoryIds?: string[];
  adminCategoryIds?: string[];
  altPhone?: string;
  landline?: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  address: string;
  mapLink: string;
  email: string;
  website: string;
  enquiryFields: {
    requireName: boolean;
    requirePhone: boolean;
    requireEmail: boolean;
    requireMessage: boolean;
  };

  // Step 2: About & Specialities
  establishmentYear: number | string;
  gstNumber: string;
  showCategoryInCard: boolean;
  isCategoryDigitalCard?: boolean;
  natureOfBusiness: string[];
  businessNatures?: string[];
  businessNature?: string[];
  basicDetailsServices?: string[];
  specialities: string[];
  aboutNarrative: string;
  aboutUsText?: string;
  removeDocumentIds?: string[];
  brochureName: string;
  brochureSize: string;
  brochureDate: string;
  brochureUrl?: string;
  documents?: CompanyDocument[];

  // Step 3: Products & Services
  products: ProductItem[];

  // Step 4: Links & Social — field names match the backend customers/links API exactly
  quickLinks: QuickLink[];
  socialLinks?: SocialLink[];
  websiteLink: string;
  gmbPinAdded: boolean;
  catalogueConfigured: boolean;
  whatsappGroupMembers: string;
  telegramConnected: boolean;
  twitterConfigured: boolean;

  // ─── Exact backend field names (customers/links API) ─────────────────────
  customLink?: string;         // custom link button
  whatsappLinks?: string;      // WhatsApp direct message link
  emailLinks?: string;         // mailto link
  callLinks?: string;          // tel link
  instagramLink?: string;
  facebookLink?: string;
  youTubeLink?: string;
  linkedinLink?: string;
  webSiteLink?: string;        // website URL (maps to profile.website)
  location?: string;           // Google Maps / location link
  googleMyBussiness?: string;  // GMB link
  twitter?: string;            // Twitter / X link
  telegram?: string;           // Telegram channel link
  catalogue?: string;          // Catalogue / store link
  bookingLink?: string;
  goLink?: string;
  pdfLink?: string;
  videoLink?: string;
  imageLink?: string;
  zomatoLink?: string;
  swiggyLink?: string;
  uberLink?: string;
  slackLink?: string;
  whatsappGroup?: string;      // WhatsApp group invite link
  facebookGroup?: string;
  spotifyLink?: string;
  amazonLink?: string;
  meshowLink?: string;
  shopify?: string;
  appStoreLink?: string;
  discordLink?: string;

  // Step 5: Payment & QR (exact backend fields: upiId, paymentPhoneNo, bankName, bankAccountNumber, bankIfscCode, bankHolderName, accountType)
  upiId: string;
  upiNumber: string;
  paymentPhoneNo?: string;
  paytmPhone: string;
  phonePePhone: string;
  gPayPhone: string;
  paytmQrUploaded: boolean;
  phonePeQrUploaded: boolean;
  gPayQrUploaded: boolean;
  bankName: string;
  accountHolderName: string;
  bankHolderName?: string;
  accountNumber: string;
  bankAccountNumber?: string;
  ifscCode: string;
  bankIfscCode?: string;
  accountType: 'Current Account' | 'Savings Account' | string;

  // Step 6: Gallery & Media
  galleryImages: GalleryImage[];
  youtubeVideos: YoutubeVideo[];

  // Step 8: Settings, Headings & Pricing
  amount: number;
  renewalAmount: number;
  visibility: {
    hideLinksSection: boolean;
    hideAboutSection: boolean;
    hideProductsSection: boolean;
    hidePaymentSection: boolean;
    hideGallerySection: boolean;
    hideYoutubeSection: boolean;
    hideFeedbackSection: boolean;
    hideEnquirySection: boolean;
    hideShareSection: boolean;
    hideUnenteredSocialMediaLinks: boolean;
    hideViewsCounter: boolean;
  };
  headings: {
    linksHeading: string;
    aboutUsHeading: string;
    productsHeading: string;
    paymentHeading: string;
    galleryHeading: string;
    youtubeVideosHeading: string;
    feedbackHeading: string;
    enquirySectionHeading: string;
    specialitiesSubheading: string;
  };
  navLabels: {
    home: string;
    links: string;
    about: string;
    products: string;
    payment: string;
    enquiry: string;
    gallery: string;
    videos: string;
    feedback: string;
  };
}
