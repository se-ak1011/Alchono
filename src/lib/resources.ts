import { Platform } from 'react-native';

export type Resource = {
  title: string;
  description: string;
  action: string;
  url: string;
};

/** Crisis + support services. `internal:` urls route in-app; the rest open out. */
export const RESOURCE_SECTIONS: { heading: string; items: Resource[] }[] = [
  {
    heading: 'Right now',
    items: [
      {
        title: 'Emergency — 999',
        description: 'Medical emergency, danger to yourself or others.',
        action: 'Call 999',
        url: 'tel:999',
      },
      {
        title: 'Samaritans',
        description: 'Whatever you are going through. Free, 24/7, confidential.',
        action: 'Call 116 123',
        url: 'tel:116123',
      },
      {
        title: 'Shout',
        description: 'Free 24/7 crisis support by text, if talking feels like too much.',
        action: 'Text SHOUT to 85258',
        url: Platform.OS === 'ios' ? 'sms:85258&body=SHOUT' : 'sms:85258?body=SHOUT',
      },
      {
        title: 'NHS 111',
        description: 'Urgent mental health support — choose the mental health option.',
        action: 'Call 111',
        url: 'tel:111',
      },
    ],
  },
  {
    heading: 'Alcohol support',
    items: [
      {
        title: 'Drinkline',
        description: 'The national alcohol helpline. Free and confidential advice, weekdays 9am–8pm, weekends 11am–4pm.',
        action: 'Call 0300 123 1110',
        url: 'tel:03001231110',
      },
      {
        title: 'Alcoholics Anonymous',
        description: 'Free helpline and meetings across the UK, run by people in recovery.',
        action: 'Call 0800 9177 650',
        url: 'tel:08009177650',
      },
      {
        title: 'AA meeting finder',
        description: 'Find an AA meeting near you, in person or online.',
        action: 'Open website',
        url: 'https://www.alcoholics-anonymous.org.uk/aa-meetings/find-a-meeting',
      },
      {
        title: 'SMART Recovery UK',
        description: 'Science-based mutual aid meetings — an alternative to 12-step.',
        action: 'Open website',
        url: 'https://smartrecovery.org.uk',
      },
      {
        title: 'NHS alcohol advice',
        description: 'Cutting down, risks, and where to get local treatment.',
        action: 'Open website',
        url: 'https://www.nhs.uk/live-well/alcohol-advice/',
      },
    ],
  },
  {
    heading: 'For the people around you',
    items: [
      {
        title: 'Al-Anon',
        description: 'Support for family and friends affected by someone else’s drinking.',
        action: 'Call 0800 0086 811',
        url: 'tel:08000086811',
      },
      {
        title: 'NACOA',
        description: 'For anyone affected by a parent’s drinking — at any age.',
        action: 'Call 0800 358 3456',
        url: 'tel:08003583456',
      },
    ],
  },
  {
    heading: 'Professional help',
    items: [
      {
        title: 'Find a counsellor',
        description: 'Verified recovery professionals on Alchono — websites and booking links included.',
        action: 'Browse the directory',
        url: 'internal:/counsellors',
      },
    ],
  },
  {
    heading: 'Talk online',
    items: [
      {
        title: '7 Cups',
        description: 'Free, anonymous chat with trained listeners.',
        action: 'Open website',
        url: 'https://www.7cups.com',
      },
    ],
  },
  {
    heading: 'More than alcohol?',
    items: [
      {
        title: 'Recovery ecosystem',
        description:
          'Struggling with smoking, gambling, or something else too? Sister apps to Alchono are on the way.',
        action: "See what's coming",
        url: 'internal:/ecosystem',
      },
    ],
  },
];

export const SWAPS_SECTION = {
  heading: 'Swap, don’t fight',
  items: [
    {
      title: 'Alcohol-free alternatives',
      description: 'Same ritual, same glass, zero alcohol — 0.0 beers, spirits, and fizz that actually taste right.',
      action: 'See the list',
      url: 'internal:/swaps',
    },
  ],
};
