import { isRecordActive } from '@/lib/api/superadmin/admin';
import { isPlanLive, pickPlanTerms } from '@/lib/api/superadmin/plan';
import { AdminRow, FormValues } from './schema';

/** List out of the different response shapes ([...] / { data: { admins } } / { admins } / { data: [...] }) */
export const listFromResponse = (data: any, key: 'admins' | 'categories'): any[] =>
  Array.isArray(data)
    ? data
    : data?.data?.[key] ||
      data?.[key] ||
      (Array.isArray(data?.data) ? data.data : []);

/** API admin record -> table row */
export const toAdminRow = (each: any, idx: number, rawCategoryList: any[], isFranchise: boolean): AdminRow => {
  // Extract category names from adminCategories array, adminCategory object, or rawCategoryList match
  const extractedCatNames: string[] = [];

  if (Array.isArray(each.adminCategories) && each.adminCategories.length > 0) {
    each.adminCategories.forEach((ac: any) => {
      const id = ac.adminCategoryId || ac.adminCategory?.id || ac.id;
      const name =
        ac.adminCategory?.name ||
        ac.adminCategory?.CategoryName ||
        ac.name ||
        ac.categoryName ||
        rawCategoryList.find((c) => c.id === id || c._id === id)?.name;
      if (name && typeof name === 'string' && name.trim() && !extractedCatNames.includes(name.trim())) {
        extractedCatNames.push(name.trim());
      }
    });
  }

  if (extractedCatNames.length === 0) {
    const matchedCategory = rawCategoryList.find(
      (c) => c.id === each.adminCategoryId || c._id === each.adminCategoryId || c.name === each.category || c.id === each.category?.id,
    );
    const singleName =
      each?.adminCategory?.name ||
      each?.adminCategory?.CategoryName ||
      matchedCategory?.name ||
      each.category?.name ||
      (typeof each.category === 'string' ? each.category : '') ||
      each.categoryName;
    if (singleName && typeof singleName === 'string' && singleName.trim()) {
      extractedCatNames.push(singleName.trim());
    }
  }

  const catName = extractedCatNames.length > 0 ? extractedCatNames.join(', ') : '-';

  const priceDisplay =
    each.amount !== null && each.amount !== undefined
      ? `₹${each.amount}`
      : each.price !== undefined
      ? `₹${each.price}`
      : 'N/A';

  const renewalDisplay =
    each.renewalAmount !== null && each.renewalAmount !== undefined
      ? `₹${each.renewalAmount}`
      : 'N/A';

  const endRaw = each.expiryDate || each.endDate;
  const createdRaw = each.createdAt || each.created_at || each.user?.createdAt || each.startDate;
  let formattedDateTime = '-';
  if (createdRaw) {
    try {
      const d = new Date(createdRaw);
      if (!isNaN(d.getTime())) {
        formattedDateTime = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch {}
  }

  const priceNum = Number(each.amount || each.price || 0);
  // With a selected plan the status follows its expiry date; older records keep the previous rule
  const planTerms = pickPlanTerms(each);
  const isSubscribed = planTerms ? isPlanLive(planTerms) : priceNum > 0 || each.status === 'ACTIVE' || each.isActive;

  const rawId = String(each.id || each._id || '');
  const businessId = each.businessId || (rawId.length > 5 ? rawId.slice(-5) : String(14837 - idx));

  const creatorRole =
    each.createdBy?.role ||
    each.role ||
    (each.franchiseId || each.franchise ? 'Franchise' : 'SuperAdmin');

  const creatorName =
    each.createdBy?.fullname ||
    each.franchise?.fullname ||
    each.franchise?.name ||
    each.madeBy ||
    (isFranchise ? 'Franchise Partner' : 'Ratan Chavan');

  const creatorPhone = each.createdBy?.phoneNumber || each.franchise?.phoneNumber || '8482980338';
  const creatorDisplay = `${creatorName} (${creatorRole}${creatorPhone ? ` - ${creatorPhone}` : ''})`;

  return {
    id: each.id || each._id || '',
    businessId,
    fullname: each?.user?.fullname || each.fullname || 'Admin',
    categoryName: catName,
    categoryNames: extractedCatNames,
    contactDisplay: each?.user?.phoneNumber || each.phoneNumber || each.user?.email || each.email || '-',
    creationDate: formattedDateTime,
    madeBy: each.digitalCard?.madeBy?.label || creatorDisplay,
    aiCredit: each.aiCredit !== undefined ? each.aiCredit : 0,
    subscriptionStatus: isSubscribed ? 'Subscribed' : 'Not Subscribed',
    email: each.user?.email || each.email || '',
    phoneNumber: each?.user?.phoneNumber || each.phoneNumber || '',
    secondaryPhoneNumber: each.user?.secondaryPhoneNumber || each.secondaryPhoneNumber,
    price: priceDisplay,
    renewalAmount: renewalDisplay,
    address: each?.user?.address || each.address || '',
    startDate: each.startDate ? String(each.startDate).split('T')[0] : '',
    endDate: endRaw ? String(endRaw).split('T')[0] : '',
    dateTime: formattedDateTime,
    isActive: isRecordActive(each),
    raw: each,
  };
};

/** API admin record -> form values for editing (dates as yyyy-mm-dd; end defaults to start + 1 year) */
export const toFormValues = (toEdit: any) => {
  const startRaw = toEdit.startDate;
  const endRaw = toEdit.expiryDate || toEdit.endDate;

  let startFormatted = '';
  if (startRaw) {
    try {
      startFormatted = new Date(startRaw).toISOString().split('T')[0];
    } catch {}
  }

  let endFormatted = '';
  if (endRaw) {
    try {
      endFormatted = new Date(endRaw).toISOString().split('T')[0];
    } catch {}
  } else if (startRaw) {
    try {
      const d = new Date(startRaw);
      d.setFullYear(d.getFullYear() + 1);
      endFormatted = d.toISOString().split('T')[0];
    } catch {}
  }

  const amountVal =
    toEdit.amount !== null && toEdit.amount !== undefined
      ? toEdit.amount
      : toEdit.price !== null && toEdit.price !== undefined
      ? toEdit.price
      : undefined;

  const renewalVal =
    toEdit.renewalAmount !== null && toEdit.renewalAmount !== undefined
      ? toEdit.renewalAmount
      : 0;

  return {
    fullname: toEdit.user?.fullname || toEdit.fullname || '',
    email: toEdit.user?.email || toEdit.email || '',
    phoneNumber: toEdit.user?.phoneNumber || toEdit.phoneNumber || '',
    secondaryPhoneNumber: toEdit.secondaryPhoneNumber || toEdit.user?.secondaryPhoneNumber || '',
    address: toEdit.user?.address || toEdit.address || '',
    price: amountVal,
    renewalAmount: renewalVal,
    startDate: startFormatted as any,
    endDate: endFormatted as any,
    password: '',
  };
};

/** Form values -> create / update payload (end date set to 23:59:59 UTC) */
export const toAdminPayload = (data: FormValues) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  end.setUTCHours(23, 59, 59, 0);

  const priceNumber =
    data.price !== undefined && data.price !== null && data.price !== ('' as any)
      ? Number(data.price)
      : undefined;

  const renewalNumber =
    data.renewalAmount !== undefined && data.renewalAmount !== null && data.renewalAmount !== ('' as any)
      ? Number(data.renewalAmount)
      : 0;

  const payload: any = {
    amount: priceNumber,
    price: priceNumber,
    renewalAmount: renewalNumber,
    fullname: data.fullname,
    email: data.email,
    phoneNumber: data.phoneNumber,
    secondaryPhoneNumber: data.secondaryPhoneNumber || '',
    address: data.address,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    expiryDate: end.toISOString(),
    role: 'ADMIN',
  };
  return payload;
};
