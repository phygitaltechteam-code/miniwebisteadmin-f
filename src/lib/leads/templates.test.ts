import {describe, expect, it} from 'vitest';
import {
  callNumber,
  fillTemplate,
  firstName,
  mailtoHref,
  reviewLinkFor,
  whatsAppNumber,
} from './templates';

// Ported from ocrLead-app FeaturesTest.kt
const DEFAULT_WHATSAPP_TEMPLATE =
  "Hi {first_name}, this is {my_name}. It was great meeting you{at_event}. Let's stay in touch!";

const asha = {
  name: 'Dr. Asha Patel',
  company: 'Nimbus Pvt Ltd',
  mobile: '+91 98200 12345',
  email: 'asha@nimbus.in',
  event: 'Pune Expo',
};

describe('fillTemplate', () => {
  it('fills placeholders and skips the honorific', () => {
    expect(fillTemplate(DEFAULT_WHATSAPP_TEMPLATE, asha, 'Suhel')).toBe(
      "Hi Asha, this is Suhel. It was great meeting you at Pune Expo. Let's stay in touch!",
    );
  });

  it('works without an event or a name', () => {
    expect(
      fillTemplate(
        'Hi {first_name}, great meeting you{at_event}.',
        {company: 'X'},
        '',
      ),
    ).toBe('Hi there, great meeting you.');
  });

  it('replaces every occurrence and trims line ends', () => {
    const text = fillTemplate(
      '{name} / {name}  \n\n{company}{event}  \n{my_name}',
      asha,
      ' Suhel ',
    );
    expect(text).toBe(
      'Dr. Asha Patel / Dr. Asha Patel\n\nNimbus Pvt LtdPune Expo\nSuhel',
    );
  });

  it('handles null fields from the API', () => {
    expect(
      fillTemplate(
        'Hi {first_name} from {company}',
        {name: null, company: null},
        'Me',
      ),
    ).toBe('Hi there from');
  });

  it('fills {card_link} and {review_link}', () => {
    expect(
      fillTemplate(
        'My digital card: {card_link}\nReview us: {review_link}',
        asha,
        'Suhel',
        {
          cardLink: 'https://digiwebcard.com/nimbus',
          reviewLink: 'https://digiwebcard.com/nimbus?review=1',
        },
      ),
    ).toBe(
      'My digital card: https://digiwebcard.com/nimbus\nReview us: https://digiwebcard.com/nimbus?review=1',
    );
  });

  it('builds the review link from the card link when the server sends none', () => {
    expect(
      fillTemplate('{review_link}', asha, '', {
        cardLink: ' https://digiwebcard.com/nimbus ',
      }),
    ).toBe('https://digiwebcard.com/nimbus?review=1');
    expect(
      fillTemplate('{review_link}', asha, '', {
        cardLink: 'https://digiwebcard.com/card?id=7',
        reviewLink: null,
      }),
    ).toBe('https://digiwebcard.com/card?id=7&review=1');
  });

  it('leaves the link placeholders empty without links', () => {
    expect(
      fillTemplate('Card: {card_link} Review: {review_link}', asha, 'Me'),
    ).toBe('Card:  Review:');
    expect(
      fillTemplate('{card_link}{review_link}', asha, 'Me', {cardLink: null}),
    ).toBe('');
  });
});

describe('reviewLinkFor', () => {
  it('prefers the server review link', () => {
    expect(
      reviewLinkFor({
        cardLink: 'https://a.in/x',
        reviewLink: 'https://a.in/x#feedback',
      }),
    ).toBe('https://a.in/x#feedback');
    expect(reviewLinkFor({cardLink: 'https://a.in/x'})).toBe(
      'https://a.in/x?review=1',
    );
    expect(reviewLinkFor()).toBe('');
  });
});

describe('firstName', () => {
  it('skips honorifics with or without a dot', () => {
    expect(firstName('Mr Ravi Kumar')).toBe('Ravi');
    expect(firstName('Smt. Sunita Rao')).toBe('Sunita');
    expect(firstName('  Prof.  Anil  ')).toBe('Anil');
    expect(firstName('Dr.')).toBe('');
  });
});

describe('whatsAppNumber', () => {
  it('returns digits with the country code', () => {
    expect(whatsAppNumber(asha)).toBe('919820012345');
    expect(whatsAppNumber({otherPhone: '98200 54321, 022 2345 6789'})).toBe(
      '919820054321',
    );
    expect(whatsAppNumber({officePhone: '022 2345 6789'})).toBeNull();
  });
});

describe('callNumber', () => {
  it('prefers mobile, then office, then the first other number', () => {
    expect(callNumber(asha)).toBe('+91 98200 12345');
    expect(callNumber({officePhone: ' 022 2345 6789 '})).toBe('022 2345 6789');
    expect(callNumber({otherPhone: '98200 54321, 022 2345 6789'})).toBe(
      '98200 54321',
    );
    expect(callNumber({name: 'Nobody'})).toBeNull();
  });
});

describe('mailtoHref', () => {
  it('encodes subject and body', () => {
    expect(mailtoHref('asha@nimbus.in', 'Hi & bye', 'Line 1\nLine 2')).toBe(
      'mailto:asha@nimbus.in?subject=Hi%20%26%20bye&body=Line%201%0ALine%202',
    );
  });
});
