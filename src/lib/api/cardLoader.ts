import { ProfileData, CardSectionKey, DEFAULT_SECTION_ORDER } from '@/types/profile';
import { getCustomerInfo } from './customerInfoApi';
import { getCustomerAbout } from './customerAboutApi';
import { getCustomerProducts, normalizeBackendProduct } from './customerProductsApi';
import { getCustomerLinks, parseCustomerLinksResponse } from './customerSocialApi';
import { getCustomerPayment, parseCustomerPaymentResponse } from './customerPaymentApi';
import { getCustomerGallery, parseCustomerGalleryResponse } from './customerGalleryApi';
import { getCustomerVideos, parseCustomerVideosResponse } from './customerVideosApi';
import { getCustomerSettings, parseSettingsOrder } from './customerSettingsApi';

/**
 * Whole saved card for the builder preview, loaded up front (not only when a step is opened).
 * adminId → superAdmin/admin/:adminId/… (super admin / franchise); no adminId → customers/… (admin's own login).
 */
export type CardSections = PromiseSettledResult<any>[];

export const loadCardSections = (adminId?: string): Promise<CardSections> =>
  Promise.allSettled([
    getCustomerInfo(adminId),
    getCustomerAbout(adminId),
    getCustomerProducts({ page: 1, limit: 100 }, adminId),
    getCustomerLinks(adminId),
    getCustomerPayment(adminId),
    getCustomerGallery(adminId),
    getCustomerVideos(adminId),
    getCustomerSettings(adminId),
  ]);

const valueOf = (r: PromiseSettledResult<any>) => (r.status === 'fulfilled' ? r.value : undefined);
const text = (v: any, key?: string): string =>
  typeof v === 'string' ? v.trim() : String((key && v?.[key]) || v?.name || v?.title || '').trim();

/** Loaded sections merged into the profile (fields the server has no value for keep their current value) */
export const applyCardSections = (prev: ProfileData, sections: CardSections): ProfileData => {
  const [infoRes, aboutRes, prodRes, linksRes, payRes, galRes, vidRes, settRes] = sections.map(valueOf);
  const updated = { ...prev };

  // 1. Info
  if (infoRes) {
    const data = infoRes?.data || infoRes?.customer || infoRes?.info || infoRes;
    if (data && typeof data === 'object') {
      if (data.businessName) updated.businessName = data.businessName;
      const tagline = data.tagline || data.businessTagline || data.businessTagLine;
      if (tagline) {
        updated.tagline = tagline;
        updated.businessTagline = tagline;
      }
      if (data.contactName) updated.contactName = data.contactName;
      if (data.prefix) updated.prefix = data.prefix;
      if (data.firstName) updated.firstName = data.firstName;
      if (data.lastName) updated.lastName = data.lastName;
      if (data.designation) updated.designation = data.designation;
      if (data.primaryPhone) updated.primaryPhone = data.primaryPhone;
      if (data.alternatePhone || data.altPhone) updated.altPhone = data.alternatePhone || data.altPhone;
      if (data.whatsappNumber || data.whatsappPhone) {
        updated.whatsappPhone = data.whatsappNumber || data.whatsappPhone;
        updated.whatsappNumber = data.whatsappNumber || data.whatsappPhone;
      }
      if (data.email) updated.email = data.email;
      if (data.address) updated.address = data.address;
      if (data.city) updated.city = data.city;
      if (data.state) updated.state = data.state;
      if (data.district) updated.district = data.district;
      if (data.pincode) updated.pincode = data.pincode;
      if (data.website) updated.website = data.website;
      if (data.theme) updated.theme = data.theme;
      if (data.logoUrl) updated.logoUrl = data.logoUrl;
      if (data.bannerUrl) updated.bannerUrl = data.bannerUrl;
      // The info API returns the full banner list as bannerUrls (bannerUrl is only the first)
      const savedBanners = Array.isArray(data.bannerUrls) && data.bannerUrls.length > 0 ? data.bannerUrls : data.banners;
      if (Array.isArray(savedBanners) && savedBanners.length > 0) {
        updated.banners = savedBanners;
      } else if (data.bannerUrl) {
        updated.banners = [data.bannerUrl];
      }
      if (data.vanityUrl) updated.vanityUrl = data.vanityUrl;
      if (data.mapLink) updated.mapLink = data.mapLink;
      if (data.hasLogoBorder !== undefined) updated.hasGoldenBorder = Boolean(data.hasLogoBorder);
      if (data.showCategoryInCard !== undefined) updated.showCategoryInCard = Boolean(data.showCategoryInCard);
      if (Array.isArray(data.businessNatures) && data.businessNatures.length > 0) {
        updated.servicesOffered = data.businessNatures.map((n: any) => text(n, 'businessNature')).filter(Boolean);
      }
    }
  }

  // 2. About ({ aboutUs, basicDetailsServices } or the about object itself)
  if (aboutRes) {
    const raw = aboutRes?.data || aboutRes?.about || aboutRes;
    const about = raw?.aboutUs || raw?.about || (raw && !raw.basicDetailsServices ? raw : null);
    const natures = raw?.basicDetailsServices || about?.businessNatures;
    if (Array.isArray(natures) && natures.length > 0) {
      updated.servicesOffered = natures.map((n: any) => text(n, 'businessNature')).filter(Boolean);
    }
    if (about && typeof about === 'object') {
      if (about.establishmentYear) updated.establishmentYear = String(about.establishmentYear);
      if (about.gstNumber) updated.gstNumber = about.gstNumber;
      const narrative = about.aboutUsText || about.aboutNarrative;
      if (narrative) updated.aboutNarrative = narrative;
      if (Array.isArray(about.specialities) && about.specialities.length > 0) {
        updated.specialities = about.specialities.map((s: any) => text(s, 'specialities')).filter(Boolean);
      }
      const rawDocs = about.officialDocuments || about.documents;
      if (Array.isArray(rawDocs) && rawDocs.length > 0) {
        updated.documents = rawDocs.map((d: any, idx: number) => ({
          id: d.id || d._id || `doc_${idx}`,
          name: d.fileName || d.name || `Document_${idx + 1}`,
          fileName: d.fileName || d.name || `Document_${idx + 1}`,
          url: d.fileUrl || d.url || '',
          size: d.size || '',
          uploadedAt: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : d.uploadedAt || '',
          type: d.type || (String(d.fileUrl || '').match(/\.(jpeg|jpg|png|webp)/i) ? 'IMAGE' : String(d.fileUrl || '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'DOC'),
        }));
      }
    }
  }

  // 3. Products (saved order)
  if (prodRes) {
    const rawProds = prodRes?.data?.products || prodRes?.data || prodRes?.products || (Array.isArray(prodRes) ? prodRes : []);
    if (Array.isArray(rawProds) && rawProds.length > 0) updated.products = rawProds.map(normalizeBackendProduct);
  }

  // 4. Links (incl. custom links, order and hidden links)
  if (linksRes) {
    const rawLinks = linksRes?.data || linksRes;
    if (rawLinks && typeof rawLinks === 'object') Object.assign(updated, parseCustomerLinksResponse(rawLinks));
  }

  // 5. Payment: bank, UPI, wallets (numbers, QRs, ids, show-on-card)
  if (payRes) {
    const parsed = parseCustomerPaymentResponse(payRes);
    if (parsed && typeof parsed === 'object') {
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== '' && value !== undefined && value !== null) (updated as any)[key] = value;
      });
    }
  }

  // 6. Gallery, 7. Videos
  if (galRes) {
    const normalized = parseCustomerGalleryResponse(galRes);
    if (Array.isArray(normalized) && normalized.length > 0) updated.galleryImages = normalized;
  }
  if (vidRes) {
    const normalized = parseCustomerVideosResponse(vidRes);
    if (Array.isArray(normalized) && normalized.length > 0) updated.youtubeVideos = normalized;
  }

  // 8. Settings: headings, menu labels, visibility, section order
  if (settRes) {
    const rawSett = settRes?.data || settRes?.settings || settRes;
    if (rawSett && typeof rawSett === 'object') {
      if (rawSett.headings) updated.headings = { ...updated.headings, ...rawSett.headings };
      if (rawSett.navLabels) updated.navLabels = { ...updated.navLabels, ...rawSett.navLabels };
      if (rawSett.visibility) updated.visibility = { ...updated.visibility, ...rawSett.visibility };
      if (rawSett.amount !== undefined) updated.amount = rawSett.amount;
      if (rawSett.renewalAmount !== undefined) updated.renewalAmount = rawSett.renewalAmount;
      const orders = parseSettingsOrder(rawSett);
      if (orders.sectionOrder) {
        const valid = orders.sectionOrder.filter((k) => DEFAULT_SECTION_ORDER.includes(k as CardSectionKey));
        if (valid.length > 0) updated.sectionOrder = valid as CardSectionKey[];
      }
      if (orders.aboutBlockOrder) updated.aboutBlockOrder = orders.aboutBlockOrder;
      // The links API returns its own linkOrder; the settings one is only a fallback
      if (orders.linkOrder && !updated.linkOrder?.length) updated.linkOrder = orders.linkOrder;
      // Older cards kept these in settings; the links / payment APIs win when they return them
      if (orders.hiddenLinks && !updated.hiddenLinks) updated.hiddenLinks = orders.hiddenLinks;
      if (orders.hiddenPayments && !updated.hiddenPayments) updated.hiddenPayments = orders.hiddenPayments;
    }
  }

  return updated;
};
