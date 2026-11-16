// Port of DuplicateCheckerTest.kt.
import {describe, expect, it} from 'vitest';
import {findDuplicate, merge, type LeadLike} from './duplicates';

describe('DuplicateChecker', () => {
  const asha: LeadLike = {
    id: 'a',
    name: 'Asha Patel',
    company: 'Nimbus Pvt Ltd',
    mobile: '+91 98200 12345',
    email: 'asha@nimbus.in',
  };

  it('matches the same mobile written differently', () => {
    expect(findDuplicate({id: 'b', mobile: '098200-12345'}, [asha], 'IN')).toBe(
      asha,
    );
  });

  it('matches the same email in any case', () => {
    expect(
      findDuplicate({id: 'b', email2: 'ASHA@nimbus.in'}, [asha], 'IN'),
    ).toBe(asha);
  });

  it('matches a near-identical name and company', () => {
    expect(
      findDuplicate(
        {id: 'b', name: 'Asha Patil', company: 'Nimbus Pvt. Ltd.'},
        [asha],
        'IN',
      ),
    ).toBe(asha);
  });

  it('does not match colleagues sharing an office phone and info@ mail', () => {
    const a = {
      ...asha,
      officePhone: '+91 22 2345 6789',
      email: 'info@nimbus.in',
      mobile: '',
    };
    const colleague = {
      id: 'b',
      name: 'Ravi Kumar',
      company: 'Nimbus Pvt Ltd',
      officePhone: '022 2345 6789',
      email: 'info@nimbus.in',
    };
    expect(findDuplicate(colleague, [a], 'IN')).toBeNull();
  });

  it('does not match the same name at a different company', () => {
    expect(
      findDuplicate(
        {id: 'b', name: 'Asha Patel', company: 'Orbit Industries'},
        [asha],
        'IN',
      ),
    ).toBeNull();
  });

  it('does not match a lead with itself', () => {
    expect(findDuplicate(asha, [asha], 'IN')).toBeNull();
  });

  it('matches a new scan that has no id yet', () => {
    expect(findDuplicate({mobile: '98200 12345'}, [asha], 'IN')).toBe(asha);
  });

  it('works with API leads whose empty fields are null', () => {
    const api = {...asha, email: null, email2: null, otherPhone: null};
    expect(findDuplicate({id: 'b', mobile: '+919820012345'}, [api], 'IN')).toBe(
      api,
    );
  });

  it('merge fills gaps and keeps conflicts in notes', () => {
    const scan: LeadLike = {
      id: 'b',
      name: 'Asha Patel',
      jobTitle: 'Sales Director',
      mobile: '+91 99999 00000',
      notes: 'Met at expo',
    };
    const merged = merge(asha, scan);
    expect(merged.id).toBe('a');
    expect(merged.jobTitle).toBe('Sales Director');
    expect(merged.mobile).toBe('+91 98200 12345');
    expect(merged.notes).toContain('Met at expo');
    expect(merged.notes).toContain('Mobile: +91 99999 00000');
    expect(merged.needsReview).toBe(false);
  });
});
