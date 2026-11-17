import { z } from 'zod';

export const formSchema = z
  .object({
    fullname: z.string().min(1, 'Name is required').trim(),
    email: z.string().min(1, 'Email is required').email('Invalid email address').trim(),
    phoneNumber: z
      .string()
      .min(1, 'Phone Number is required')
      .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
      .trim(),
    secondaryPhoneNumber: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^\d{10}$/.test(val.trim()),
        'Secondary phone number must be exactly 10 digits',
      ),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    renewalAmount: z.coerce.number().min(0, 'Renewal amount must be positive').optional(),
    address: z.string().min(1, 'Address is required').trim(),
    password: z
      .string()
      .optional()
      .refine(
        (val) => !val || val.trim().length >= 6,
        'Password must be at least 6 characters',
      ),
    startDate: z.preprocess(
      (val) => (typeof val === 'string' ? new Date(val) : val),
      z.date({ required_error: 'Start date is required' }),
    ),
    endDate: z.preprocess(
      (val) => (typeof val === 'string' ? new Date(val) : val),
      z.date({ required_error: 'End date is required' }),
    ),
  })
  .refine((data) => data.startDate < data.endDate, {
    message: 'Start date must be before end date',
    path: ['endDate'],
  });

export type FormValues = z.infer<typeof formSchema>;

/** Empty form (Add New Business / after Back) */
export const EMPTY_FORM = {
  fullname: '',
  email: '',
  phoneNumber: '',
  secondaryPhoneNumber: '',
  address: '',
  password: '',
  price: undefined,
  renewalAmount: undefined,
};

/** One business row in the All Businesses table */
export type AdminRow = {
  id: string;
  businessId: string;
  fullname: string;
  categoryName: string;
  categoryNames?: string[];
  contactDisplay: string;
  creationDate: string;
  madeBy: string;
  aiCredit: number | string;
  subscriptionStatus: 'Subscribed' | 'Not Subscribed';
  email: string;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  price?: number | string;
  renewalAmount?: number | string;
  address: string;
  startDate: string;
  endDate: string;
  dateTime: string;
  isActive: boolean;
  /** Guest visits on the card (backend `totalVisits`) */
  totalVisits: number;
  raw?: any;
};
