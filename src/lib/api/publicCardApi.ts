import { unAuthenticatedApi } from '@/utils/axios';
import { initialProfileData } from '@/data/initialProfile';
import { ProfileData, CardSectionKey, DEFAULT_SECTION_ORDER } from '@/types/profile';
import { normalizeBackendProduct } from './customerProductsApi';
import { parseCustomerLinksResponse } from './customerSocialApi';
import { parseCustomerPaymentResponse } from './customerPaymentApi';
import { parseCustomerGalleryResponse } from './customerGalleryApi';
import { parseCustomerVideosResponse } from './customerVideosApi';
import { parseSettingsOrder } from './customerSettingsApi';

/**
 * Public card (no login): GET client/card/:vanityUrl
 * data = { id, profile, about, links, payment, products, gallery, videos, settings }.
 * Hidden sections are left out; a missing / inactive / expired card gives 404.
 */
export interface PublicCard {
  id: string;
  profile?: any;
  about?: any;
  links?: any;
  payment?: any;
  products?: any[];
  gallery?: any;
  videos?: any;
  settings?: any;
}

export const getPublicCard = async (vanityUrl: string): Promise<PublicCard> => {
  const res = await unAuthenticatedApi.get(`client/card/${encodeURIComponent(vanityUrl)}`);
  const body: any = res.data;
  return body?.data ?? body;
};

/** Text from a string or an object holding it ({ name } / { title } / given key) */
const text = (v: any, key?: string): string =>
  typeof v === 'string' ? v.trim() : String((key && v?.[key]) || v?.name || v?.title || '').trim();

const urlOf = (v: any): string => (typeof v === 'string' ? v : v?.url || v?.imageUrl || v?.path || '');

/** Public card response → the ProfileData the website template renders */
export const publicCardToProfile = (card: PublicCard): ProfileData => {
  const p: ProfileData = {
    ...initialProfileData,
    // Nothing from the builder's defaults may show on a live card
    products: [],
    galleryImages: [],
    youtubeVideos: [],
    servicesOffered: [],
    specialities: [],
    documents: [],
  };

  // 1. Basic info
  const info = card.profile || {};
  const tagline = info.tagline || info.businessTagline || info.businessTagLine || '';
  Object.assign(p, {
    businessName: info.businessName || info.shopName || '',
    tagline,
    businessTagline: tagline,
    vanityUrl: info.vanityUrl || '',
    prefix: info.prefix || '',
    firstName: info.firstName || '',
    lastName: info.lastName || '',
    contactName: info.contactName || [info.firstName, info.lastName].filter(Boolean).join(' '),
    designation: info.designation || '',
    primaryPhone: info.primaryPhone || '',
    altPhone: info.alternatePhone || info.altPhone || '',
    whatsappPhone: info.whatsappNumber || info.whatsappPhone || '',
    whatsappNumber: info.whatsappNumber || info.whatsappPhone || '',
    landline: info.landlineNumber || info.landline || '',
    email: info.email || '',
    address: info.address || '',
    city: info.city || '',
    district: info.district || '',
    state: info.state || '',
    pincode: info.pincode || '',
    mapLink: info.mapLink || '',
    website: info.website || '',
    websiteProtocol: info.websiteProtocol || 'https://',
    logoUrl: urlOf(info.logoUrl || info.logo),
    hasGoldenBorder: Boolean(info.hasLogoBorder ?? info.hasGoldenBorder),
  });
  if (info.theme) p.theme = info.theme;
  const rawBanners = Array.isArray(info.bannerUrls) ? info.bannerUrls : Array.isArray(info.banners) ? info.banners : [];
  const banners = rawBanners.map(urlOf).filter(Boolean);
  // Categories go in the header line only when the card is set to show them
  p.showCategoryInCard = info.showCategoryInCard !== false;
  if (p.showCategoryInCard && Array.isArray(info.categories)) {
    p.categories = info.categories.map((c: any) => text(c)).filter(Boolean);
  }
  const bannerList: string[] = banners.length ? banners : info.bannerUrl ? [info.bannerUrl] : [];
  p.banners = bannerList;
  p.bannerUrl = bannerList[0] || '';
  if (Array.isArray(info.additionalPhones)) {
    p.extraPhones = info.additionalPhones
      .map((x: any, i: number) => ({ id: `ph_${i}`, phone: text(x, 'phone') || text(x, 'number') }))
      .filter((x: any) => x.phone);
  }
  if (Array.isArray(info.additionalEmails)) {
    p.extraEmails = info.additionalEmails
      .map((x: any, i: number) => ({ id: `em_${i}`, email: text(x, 'email') }))
      .filter((x: any) => x.email);
  }

  // 2. About (same shape as the about API: { aboutUs, basicDetailsServices } or the about object itself)
  const aboutRaw = card.about || {};
  const about = aboutRaw.aboutUs || aboutRaw.about || aboutRaw;
  const natures = aboutRaw.basicDetailsServices || about.businessNatures || about.natureOfBusiness || info.businessNatures;
  if (Array.isArray(natures)) p.servicesOffered = natures.map((n: any) => text(n, 'businessNature')).filter(Boolean);
  if (Array.isArray(info.specialities)) p.specialities = info.specialities.map((s: any) => text(s, 'specialities')).filter(Boolean);
  if (about && typeof about === 'object') {
    if (about.establishmentYear) p.establishmentYear = String(about.establishmentYear);
    if (about.gstNumber) p.gstNumber = about.gstNumber;
    const narrative = about.aboutUsText || about.aboutNarrative;
    if (narrative) {
      p.aboutNarrative = narrative;
      p.aboutUsText = narrative;
    }
    if (Array.isArray(about.specialities) && about.specialities.length) {
      p.specialities = about.specialities.map((s: any) => text(s, 'specialities')).filter(Boolean);
    }
    const docs = about.officialDocuments || about.documents;
    if (Array.isArray(docs)) {
      p.documents = docs.map((d: any, idx: number) => {
        const url = d.fileUrl || d.url || '';
        return {
          id: d.id || d._id || `doc_${idx}`,
          name: d.fileName || d.name || `Document_${idx + 1}`,
          fileName: d.fileName || d.name || `Document_${idx + 1}`,
          url,
          size: d.size || '',
          uploadedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
          type: /\.(jpe?g|png|webp)/i.test(url) ? 'IMAGE' : /\.pdf$/i.test(url) ? 'PDF' : 'DOC',
        };
      });
    }
  }

  // 3. Products (saved order)
  const products = Array.isArray(card.products) ? card.products : (card.products as any)?.products;
  if (Array.isArray(products)) p.products = products.map(normalizeBackendProduct);

  // 4. Links, 5. Payment, 6. Gallery, 7. Videos — same parsers the builder uses
  // The public links block names its order `order` (the links API calls it `linkOrder`)
  if (card.links && typeof card.links === 'object') {
    const links = { ...card.links, linkOrder: card.links.linkOrder || card.links.order };
    Object.assign(p, parseCustomerLinksResponse(links));
  }
  // Public wallets are { name, phoneNo, qrImage }; the payment parser reads walletName / walletPhoneNo / walletQr
  if (card.payment && typeof card.payment === 'object') {
    const wallets = Array.isArray(card.payment.wallets)
      ? card.payment.wallets.map((w: any) => ({
          ...w,
          walletName: w.walletName || w.name,
          walletPhoneNo: w.walletPhoneNo || w.phoneNo,
          walletQr: w.walletQr || w.qrImage,
        }))
      : card.payment.wallets;
    Object.assign(p, parseCustomerPaymentResponse({ ...card.payment, wallets }));
  }
  if (card.gallery) p.galleryImages = parseCustomerGalleryResponse({ data: card.gallery });
  if (card.videos) p.youtubeVideos = parseCustomerVideosResponse({ data: card.videos });

  // 8. Settings: headings, menu labels, visibility, orders, hidden links / payments
  const s = card.settings || {};
  if (s.headings) p.headings = { ...p.headings, ...s.headings };
  if (s.navLabels) p.navLabels = { ...p.navLabels, ...s.navLabels };
  if (s.visibility) p.visibility = { ...p.visibility, ...s.visibility };
  const orders = parseSettingsOrder(s);
  if (orders.sectionOrder) {
    const valid = orders.sectionOrder.filter((k) => DEFAULT_SECTION_ORDER.includes(k as CardSectionKey));
    if (valid.length) p.sectionOrder = valid as CardSectionKey[];
  }
  if (orders.aboutBlockOrder) p.aboutBlockOrder = orders.aboutBlockOrder;
  if (orders.linkOrder && !p.linkOrder?.length) p.linkOrder = orders.linkOrder;
  if (orders.hiddenLinks) p.hiddenLinks = orders.hiddenLinks;
  if (orders.hiddenPayments) p.hiddenPayments = orders.hiddenPayments;

  return p;
};
