import { z } from 'zod';

// Reusable list schemas for string arrays / comma-separated strings
export const stringListSchema = z
  .union([z.array(z.string()), z.string()])
  .optional();

export const categoryIdsSchema = z
  .union([z.array(z.string()), z.string()])
  .optional();

// ─── Backend API Schema: customers/info (Admin Profile) ───────────────────────
export const createAdminInfoSchema = z.object({
  businessName: z.string().optional(),
  vanityUrl: z.string().optional(),
  prefix: z.string().optional(),
  contactName: z.string().optional(),
  designation: z.string().optional(),
  primaryPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  whatsappPhone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  mapLink: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  servicesOffered: z.union([z.string(), z.array(z.string())]).optional(),
  theme: z.string().optional(),
  pincode: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  showCategoryInCard: z.coerce.boolean().optional(),
  hasLogoBorder: z.coerce.boolean().optional(),

  // Multiple categories
  categoryIds: categoryIdsSchema,

  // Multiple business natures
  businessNatures: stringListSchema,
  businessNature: stringListSchema,

  // Multiple specialities
  specialities: stringListSchema,
});

export const updateAdminInfoSchema = createAdminInfoSchema.partial();

export type CreateAdminInfoValues = z.infer<typeof createAdminInfoSchema>;
export type UpdateAdminInfoValues = z.infer<typeof updateAdminInfoSchema>;

// ─── Step 1: Basic Details Schema ─────────────────────────────────────────────
export const step1BasicDetailsSchema = z.object({
  prefix: z.string().default('Mr.').optional(),
  businessName: z.string().optional().or(z.literal('')),
  vanityUrl: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  designation: z.string().optional().or(z.literal('')),
  primaryPhone: z.string().optional().or(z.literal('')),
  whatsappPhone: z.string().optional().or(z.literal('')),
  whatsappNumber: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  mapLink: z.string().optional().or(z.literal('')),
  logoUrl: z.string().optional().or(z.literal('')),
  bannerUrl: z.string().optional().or(z.literal('')),
  category: z.string().optional(),
  categories: z.array(z.string()).default([]),
  categoryIds: categoryIdsSchema,
  adminCategoryIds: categoryIdsSchema,
  servicesOffered: z.union([z.string(), z.array(z.string())]).default([]),
  theme: z.string().default('clean-white').optional(),
  pincode: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  showCategoryInCard: z.coerce.boolean().default(true).optional(),
  hasLogoBorder: z.coerce.boolean().default(true).optional(),
});

export type Step1BasicDetailsValues = z.infer<typeof step1BasicDetailsSchema>;

// ─── Step 2: About & Specialities Schema ──────────────────────────────────────
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export const establishmentYearSchema = z
  .union([z.number(), z.string()])
  .optional()
  .nullable();

export const gstNumberSchema = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => !val || val.trim() === '' || GSTIN_REGEX.test(val.trim().toUpperCase()),
    'Invalid GST number format (15 characters, e.g. 27AAAAA0000A1Z5)'
  );

export const companyDocumentSchema = z.object({
  id: z.string().optional(),
  name: z.string().optional(),
  fileName: z.string().optional(),
  url: z.string().optional(),
  size: z.string().optional(),
  uploadedAt: z.string().optional(),
  type: z.string().optional(),
  file: z.any().optional(),
});

export const upsertAboutUsSchema = z.object({
  establishmentYear: establishmentYearSchema,
  gstNumber: gstNumberSchema,
  isCategoryDigitalCard: z.coerce.boolean().default(true).optional(),
  aboutUsText: z.string().max(5000, 'About us text must be at most 5000 characters').optional().nullable(),
  aboutNarrative: z.string().max(5000).optional().nullable(),

  // Nature of business — synced from basic details services + custom entries
  businessNatures: z.union([z.array(z.string()), z.string()]).optional().default([]),
  businessNature: z.union([z.array(z.string()), z.string()]).optional().default([]),

  // Core specialities — AI generated + custom entries (each entry must be at most 100 characters)
  specialities: z
    .union([
      z.array(z.string().trim().max(100, 'Each specialities entry must be at most 100 characters')),
      z.string().trim().max(100, 'Each specialities entry must be at most 100 characters'),
    ])
    .optional()
    .default([]),

  // Official document IDs to remove in the same request
  removeDocumentIds: z.array(z.string()).default([]).optional(),

  // Attached company documents
  documents: z.array(companyDocumentSchema).optional().default([]),
});

export const step2AboutSpecialitiesSchema = upsertAboutUsSchema;
export type Step2AboutSpecialitiesValues = z.infer<typeof step2AboutSpecialitiesSchema>;

// ─── Step 3: Products & Services API Schemas (customers/products) ─────────────
export const booleanSchema = z.preprocess((val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1') return true;
    if (s === 'false' || s === '0' || s === '') return false;
  }
  if (typeof val === 'number') return val === 1;
  return Boolean(val);
}, z.boolean().default(false));

// multipart/form-data sends numbers as strings — empty string means "not provided"
export const priceSchema = z
  .preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z
      .number({ invalid_type_error: 'Price must be a number' })
      .min(0, 'Price cannot be negative')
      .max(100000000, 'Price is too large'),
  )
  .optional();

// ─── Create Product (POST customers/products) ─────────────────────────────────
export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required')
    .max(150, 'Product name must be at most 150 characters'),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().or(z.literal('')),
  currency: z
    .string()
    .trim()
    .max(10, 'Currency must be at most 10 characters')
    .optional()
    .default('INR'),
  price: priceSchema,
  // Existing image URL (when no new file is uploaded)
  image: z.string().optional(),
  isHideEnquiry: booleanSchema,
  isHideDownloadProductCart: booleanSchema,
});

// ─── Update Product (PATCH customers/products/:id) ────────────────────────────
export const updateProductSchema = createProductSchema
  .extend({
    currency: z.string().trim().max(10, 'Currency must be at most 10 characters').optional(),
    // Set true to clear the current image
    removeImage: booleanSchema,
  })
  .partial();

// ─── List Products (GET customers/products) ───────────────────────────────────
export const listProductsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
});

export const productItemSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  _id: z.string().optional(),
  name: z.string().trim().max(150, 'Product name must be at most 150 characters').optional(),
  title: z.string().trim().max(150).optional(),
  description: z.string().max(2000, 'Description must be at most 2000 characters').optional().or(z.literal('')),
  price: priceSchema,
  currency: z.string().max(10).optional().default('INR'),
  image: z.string().optional(),
  imageUrl: z.string().optional(),
  isHideEnquiry: booleanSchema.optional(),
  hideEnquiry: booleanSchema.optional(),
  isHideDownloadProductCart: booleanSchema.optional(),
  hideDownload: booleanSchema.optional(),
  isAvailable: z.boolean().default(true).optional(),
}).refine((data) => Boolean(data.name || data.title), {
  message: 'Product name is required',
  path: ['name'],
});

export const step3ProductsServicesSchema = z.object({
  products: z.array(productItemSchema).default([]),
});

export type CreateProductValues = z.infer<typeof createProductSchema>;
export type UpdateProductValues = z.infer<typeof updateProductSchema>;
export type ListProductsValues = z.infer<typeof listProductsSchema>;
export type Step3ProductsServicesValues = z.infer<typeof step3ProductsServicesSchema>;

// ─── Step 4: Links & Social Schema ────────────────────────────────────────────
export const step4LinksSocialSchema = z.object({
  website: z.string().url('Must be a valid URL').or(z.literal('')).optional(),
  facebook: z.string().or(z.literal('')).optional(),
  instagram: z.string().or(z.literal('')).optional(),
  linkedin: z.string().or(z.literal('')).optional(),
  youtube: z.string().or(z.literal('')).optional(),
  twitter: z.string().or(z.literal('')).optional(),
  catalogPdf: z.string().or(z.literal('')).optional(),
});

export type Step4LinksSocialValues = z.infer<typeof step4LinksSocialSchema>;

const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const ifscValidator = z
  .string()
  .optional()
  .nullable()
  .refine(
    (val) => !val || val.trim() === '' || ifscPattern.test(val.trim().toUpperCase()),
    { message: 'Invalid IFSC code (e.g. HDFC0001234) - must be 4 letters, 0, followed by 6 alphanumeric characters' }
  );

export const step5PaymentQRSchema = z.object({
  upiId: z.string().optional().nullable(),
  upiNumber: z.string().optional().nullable(),
  paymentPhoneNo: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  accountHolderName: z.string().optional().nullable(),
  bankHolderName: z.string().optional().nullable(),
  accountNumber: z.string().optional().nullable(),
  bankAccountNumber: z.string().optional().nullable(),
  ifscCode: ifscValidator,
  bankIfscCode: ifscValidator,
  accountType: z.string().optional().default('Savings Account'),
  qrCodeUrl: z.string().optional().nullable(),
});

export type Step5PaymentQRValues = z.infer<typeof step5PaymentQRSchema>;

// ─── Step 6: Photo Gallery Schema ─────────────────────────────────────────────
export const galleryPhotoItemSchema = z.object({
  id: z.string().optional(),
  url: z.string().optional(),
  image: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  alt: z.string().optional(),
}).refine(
  (data) => Boolean(data.url || data.image),
  { message: 'Image is required for each gallery item' }
);

export const step6GallerySchema = z.object({
  galleryImages: z.array(z.union([z.string(), galleryPhotoItemSchema])).default([]),
});

export type Step6GalleryValues = z.infer<typeof step6GallerySchema>;
export const step6GalleryMediaSchema = step6GallerySchema;
export type Step6GalleryMediaValues = Step6GalleryValues;

// ─── Step 7: YouTube Video Gallery Schema ─────────────────────────────────────
export const youtubeVideoItemSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Video title is required').trim(),
  url: z.string().url('Must be a valid YouTube URL').trim(),
});

export const step7YoutubeVideosSchema = z.object({
  youtubeVideos: z.array(youtubeVideoItemSchema).default([]),
});

export type Step7YoutubeVideosValues = z.infer<typeof step7YoutubeVideosSchema>;

// ─── Step 8: Settings & Headings Schema ───────────────────────────────────────
export const step8SettingsHeadingsSchema = z.object({
  amount: z.number().optional(),
  renewalAmount: z.number().optional(),
  headings: z.object({
    aboutUsHeading: z.string().default('About Us'),
    productsServicesHeading: z.string().default('Products & Services'),
    paymentHeading: z.string().default('Payment Options'),
    galleryHeading: z.string().default('Gallery & Media'),
  }),
  navLabels: z.object({
    home: z.string().default('HOME'),
    links: z.string().default('LINKS'),
    about: z.string().default('ABOUT US'),
    payment: z.string().default('PAYMENT'),
  }),
  visibility: z.object({
    hideAboutSection: z.boolean().default(false),
    hideProductsSection: z.boolean().default(false),
    hidePaymentSection: z.boolean().default(false),
    hideGallerySection: z.boolean().default(false),
    hideSocialLinks: z.boolean().default(false),
    hideFeedbackForm: z.boolean().default(false),
    hideEnquiryForm: z.boolean().default(false),
  }),
});

export type Step8SettingsHeadingsValues = z.infer<typeof step8SettingsHeadingsSchema>;
export const step7SettingsHeadingsSchema = step8SettingsHeadingsSchema;
export type Step7SettingsHeadingsValues = Step8SettingsHeadingsValues;

// ─── Full Profile Schema ──────────────────────────────────────────────────────
export const fullCardProfileSchema = step1BasicDetailsSchema
  .merge(step2AboutSpecialitiesSchema)
  .merge(step3ProductsServicesSchema)
  .merge(step4LinksSocialSchema)
  .merge(step5PaymentQRSchema)
  .merge(step6GallerySchema)
  .merge(step7YoutubeVideosSchema)
  .merge(step8SettingsHeadingsSchema);

export type FullCardProfile = z.infer<typeof fullCardProfileSchema>;
