/**
 * Indian Pincode Auto-Fill Helper
 * Automatically derives City, District, and State from a 6-digit Pincode.
 */

const PINCODE_MAP: Record<string, { city: string; district: string; state: string }> = {
  '416416': { city: 'Sangli', district: 'Sangli', state: 'Maharashtra' },
  '416415': { city: 'Miraj', district: 'Sangli', state: 'Maharashtra' },
  '416404': { city: 'Madhavnagar', district: 'Sangli', state: 'Maharashtra' },
  '411001': { city: 'Pune', district: 'Pune', state: 'Maharashtra' },
  '411045': { city: 'Baner, Pune', district: 'Pune', state: 'Maharashtra' },
  '411038': { city: 'Kothrud, Pune', district: 'Pune', state: 'Maharashtra' },
  '400001': { city: 'Mumbai', district: 'Mumbai', state: 'Maharashtra' },
  '400051': { city: 'Bandra, Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra' },
  '416001': { city: 'Kolhapur', district: 'Kolhapur', state: 'Maharashtra' },
  '415001': { city: 'Satara', district: 'Satara', state: 'Maharashtra' },
  '431001': { city: 'Chhatrapati Sambhajinagar', district: 'Aurangabad', state: 'Maharashtra' },
  '440001': { city: 'Nagpur', district: 'Nagpur', state: 'Maharashtra' },
  '422001': { city: 'Nashik', district: 'Nashik', state: 'Maharashtra' },
  '110001': { city: 'New Delhi', district: 'Central Delhi', state: 'Delhi' },
  '560001': { city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka' },
  '500001': { city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana' },
  '380001': { city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat' },
};

export async function lookupPincode(
  pincode: string
): Promise<{ city: string; district: string; state: string } | null> {
  const cleanPin = pincode.replace(/\D/g, '').slice(0, 6);
  if (cleanPin.length !== 6) return null;

  // Instant local lookup
  if (PINCODE_MAP[cleanPin]) {
    return PINCODE_MAP[cleanPin];
  }

  // Fallback to Postal Pincode Public API
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
      const office = data[0].PostOffice[0];
      return {
        city: office.Block || office.Name || office.District,
        district: office.District || '',
        state: office.State || '',
      };
    }
  } catch (err) {
    // Network or abort error
    console.debug('Postal API lookup timed out or failed:', err);
  }

  return null;
}
