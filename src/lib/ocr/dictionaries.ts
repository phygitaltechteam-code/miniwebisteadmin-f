// Word lists used by the rule extractor. Verbatim copy of the Android app's Dictionaries.kt: keep them in sync.
// All lowercase; matched on whole words.

// prettier-ignore
export const titleWords = new Set([
  'ceo', 'cto', 'cfo', 'coo', 'cmo', 'cio', 'md', 'gm', 'vp', 'avp', 'svp', 'evp', 'dgm', 'agm',
  'founder', 'co-founder', 'cofounder', 'director', 'manager', 'mgr', 'head', 'lead', 'executive',
  'officer', 'president', 'chairman', 'chairperson', 'partner', 'proprietor', 'owner', 'consultant',
  'engineer', 'developer', 'designer', 'architect', 'analyst', 'specialist', 'associate', 'assistant',
  'coordinator', 'supervisor', 'administrator', 'accountant', 'advocate', 'lawyer', 'advisor', 'adviser',
  'representative', 'trainer', 'principal', 'professor', 'secretary', 'treasurer', 'intern', 'technician',
  'chief', 'sales', 'marketing', 'hr', 'operations', 'procurement', 'purchase', 'business', 'development',
  'relationship', 'account', 'accounts', 'key', 'regional', 'zonal', 'area', 'senior', 'sr', 'jr', 'junior',
  'deputy', 'dy', 'asst', 'trustee', 'member', 'agent', 'dealer', 'distributor', 'surgeon', 'physician',
  'dentist', 'pharmacist', 'photographer', 'planner', 'strategist', 'scientist', 'researcher',
]);

// prettier-ignore
const weakTitleWords = new Set([
  'sales', 'marketing', 'hr', 'operations', 'procurement', 'purchase', 'business', 'development',
  'relationship', 'account', 'accounts', 'key', 'regional', 'zonal', 'area', 'senior', 'sr', 'jr',
  'junior', 'deputy', 'dy', 'asst', 'member',
]);

/** Words strong enough to mark a line as a job title on their own (the rest only help). */
export const strongTitleWords = new Set(
  Array.from(titleWords).filter((w) => !weakTitleWords.has(w)),
);

/** Legal-entity suffixes: a line with one of these is a company name. */
// prettier-ignore
export const legalWords = new Set([
  'pvt', 'private', 'ltd', 'limited', 'llp', 'llc', 'inc', 'corp', 'corporation', 'co', 'company',
  'gmbh', 'plc', 'pte',
]);

/** Industry words common in company names but also seen elsewhere. */
// prettier-ignore
export const companyWords = new Set([
  'technologies', 'technology', 'tech', 'solutions', 'systems', 'services', 'industries', 'industry',
  'enterprises', 'enterprise', 'group', 'associates', 'international', 'global', 'ventures', 'labs',
  'studio', 'studios', 'consultants', 'consultancy', 'consulting', 'traders', 'trading', 'exports',
  'imports', 'impex', 'infotech', 'infosystems', 'software', 'pharma', 'pharmaceuticals', 'foods',
  'motors', 'logistics', 'agency', 'agencies', 'media', 'networks', 'holdings', 'bank', 'hospital',
  'clinic', 'university', 'college', 'institute', 'school', 'foundation', 'trust',
  'engineering', 'engineers', 'constructions', 'construction', 'builders', 'developers', 'realty',
  'infra', 'infrastructure', 'electricals', 'electronics', 'chemicals', 'textiles', 'fabrics', 'steel',
  'polymers', 'plastics', 'packaging', 'automation', 'communications', 'digital', 'events',
  'hotels', 'resorts', 'travels', 'tours', 'insurance', 'finance', 'financial', 'capital', 'securities',
  'investments', 'realtors', 'properties', 'estates', 'laboratories', 'diagnostics', 'healthcare',
  'store', 'stores', 'mart', 'emporium', 'jewellers', 'jewelers', 'garments', 'creations', 'designs',
  'caterers', 'catering', 'restaurant', 'bakers', 'bakery', 'sweets', 'dairy', 'farms', 'kitchen', 'cafe',
  'salon', 'spa', 'academy', 'classes', 'tutorials', 'printers', 'printing', 'suppliers', 'distributors',
  'wholesale', 'manufacturers', 'manufacturing', 'works', 'mills', 'machines',
]);

// prettier-ignore
export const honorifics = new Set(['mr', 'mrs', 'ms', 'miss', 'dr', 'er', 'ca', 'cs', 'adv', 'prof', 'shri', 'smt', 'sri']);

// prettier-ignore
export const addressWords = new Set([
  'road', 'rd', 'street', 'st', 'lane', 'ln', 'marg', 'path', 'nagar', 'floor', 'flr', 'plot', 'sector',
  'building', 'bldg', 'tower', 'complex', 'park', 'estate', 'near', 'opp', 'opposite', 'behind', 'colony',
  'society', 'chowk', 'highway', 'hwy', 'phase', 'block', 'wing', 'unit', 'suite', 'ave', 'avenue',
  'district', 'dist', 'taluka', 'tal', 'village', 'post', 'po', 'midc', 'gidc', 'industrial', 'area',
  'plaza', 'chambers', 'house', 'bhavan', 'bhawan', 'apartment', 'apartments', 'apt', 'flat', 'shop',
  'office', 'no', 'cross', 'main', 'layout', 'extension', 'ext', 'west', 'east', 'north', 'south',
  'boulevard', 'blvd', 'drive', 'court', 'ct', 'square', 'sq', 'india', 'usa', 'uae', 'pin',
  'pincode', 'zip', 'gali', 'peth', 'wadi', 'pada', 'bazar', 'bazaar', 'market', 'circle', 'junction',
]);

// prettier-ignore
export const cities = new Set([
  'mumbai', 'delhi', 'new delhi', 'pune', 'bangalore', 'bengaluru', 'chennai', 'hyderabad', 'kolkata',
  'ahmedabad', 'surat', 'jaipur', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'navi mumbai',
  'bhopal', 'visakhapatnam', 'vadodara', 'baroda', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut',
  'rajkot', 'noida', 'gurgaon', 'gurugram', 'ghaziabad', 'coimbatore', 'kochi', 'cochin', 'chandigarh',
  'mysore', 'mysuru', 'goa', 'aurangabad', 'kolhapur', 'sangli', 'solapur', 'satara', 'ahmednagar',
  'jalgaon', 'amravati', 'nanded', 'latur', 'belgaum', 'belagavi', 'hubli', 'mangalore', 'trivandrum',
  'thiruvananthapuram', 'madurai', 'bhubaneswar', 'patna', 'ranchi', 'raipur', 'dehradun', 'amritsar',
  'jodhpur', 'udaipur', 'vapi', 'valsad', 'silvassa', 'daman', 'panvel', 'kalyan', 'dombivli', 'vasai',
  'virar', 'bhiwandi', 'maharashtra', 'gujarat', 'karnataka', 'tamil nadu', 'kerala', 'telangana',
  'rajasthan', 'punjab', 'haryana', 'uttar pradesh', 'madhya pradesh', 'west bengal', 'dubai', 'london',
  'singapore', 'new york',
]);

/** Email providers whose domain says nothing about the company. */
// prettier-ignore
export const freeMailDomains = new Set([
  'gmail', 'yahoo', 'hotmail', 'outlook', 'live', 'rediffmail', 'rediff', 'icloud', 'aol', 'protonmail',
  'proton', 'zoho', 'ymail', 'msn', 'mail', 'gmx',
]);

// prettier-ignore
export const mobileLabels = new Set(['m', 'mob', 'mobile', 'cell', 'c', 'cel', 'whatsapp', 'wa', 'hp']);
// prettier-ignore
export const officeLabels = new Set([
  't', 'tel', 'telephone', 'ph', 'phone', 'p', 'o', 'off', 'office', 'landline', 'board', 'direct', 'd',
  'dir', 'w', 'work', 'l',
]);
// prettier-ignore
export const faxLabels = new Set(['f', 'fax', 'telefax']);
