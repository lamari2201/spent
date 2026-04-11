export type SpendAttribution = 'me' | 'other' | 'split';

export const SPENT_CATEGORIES = [
  'Rent',
  'House',
  'Parking',
  'Mobile',
  'Lyfts',
  'Groceries',
  'Dinners',
  'Subs',
  'Therapy',
  'Gym',
  'Clothing',
  'Personal care',
  'Medical',
  'Gifts',
  'Other',
  'Travel',
] as const;

export type SpentCategory = (typeof SPENT_CATEGORIES)[number];

export type SpendEntry = {
  id: string;
  amount: number;
  myPortion: number;
  category: SpentCategory;
  createdAt: string;
};

export type PeriodSnapshot = {
  id: string;
  monthKey: string;
  grandTotal: number;
  categoryJson: string;
  resetAt: string;
};
