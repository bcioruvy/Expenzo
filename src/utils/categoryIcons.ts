import {
  UtensilsCrossed, ShoppingBasket, Car, Fuel, Zap, Wifi, Smartphone, Home, Landmark,
  HeartPulse, ShieldCheck, GraduationCap, Shirt, Clapperboard, Repeat, Plane,
  HandCoins, HeartHandshake, Sparkles, ShoppingBag, Dumbbell, TriangleAlert, MoreHorizontal,
  Briefcase, Gift as GiftIcon, TrendingUp, Building2, ReceiptText, Wallet, Coins, Banknote,
  HelpCircle, LucideIcon
} from 'lucide-react';
import { Category } from '../types';

// Maps every icon name we use (stored as a string in Firestore, since icon components
// themselves aren't serializable) to its actual lucide-react component. When adding a new
// icon option, register it here first — this map is the single source of truth for what's
// renderable.
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  UtensilsCrossed, ShoppingBasket, Car, Fuel, Zap, Wifi, Smartphone, Home, Landmark,
  HeartPulse, ShieldCheck, GraduationCap, Shirt, Clapperboard, Repeat, Plane,
  HandCoins, HeartHandshake, Sparkles, ShoppingBag, Dumbbell, TriangleAlert, MoreHorizontal,
  Briefcase, Gift: GiftIcon, TrendingUp, Building2, ReceiptText, Wallet, Coins, Banknote,
  HelpCircle,
};

// A curated list of icon names offered when picking/changing a category's icon.
export const AVAILABLE_ICON_NAMES: string[] = Object.keys(CATEGORY_ICON_MAP);

// Resolves an icon name to its component, falling back to HelpCircle for any name that
// isn't recognized (e.g. an icon added in a future version the user hasn't updated to yet).
export const resolveCategoryIcon = (iconName: string): LucideIcon => {
  return CATEGORY_ICON_MAP[iconName] || HelpCircle;
};

// Seed data for a brand-new user's categories collection. Mirrors the categories that used
// to be hardcoded in utils/categories.ts, now with an icon assigned to each. These are
// written to Firestore once, on first load, if the user has no categories yet — after that,
// the user's own Firestore data is the source of truth (they can rename/archive/add freely).
export const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: 'Salary', icon: 'Briefcase' },
  { name: 'Bonus', icon: 'Gift' },
  { name: 'Overtime', icon: 'ReceiptText' },
  { name: 'Freelance', icon: 'Landmark' },
  { name: 'Investment Returns', icon: 'TrendingUp' },
  { name: 'Rental Income', icon: 'Building2' },
  { name: 'Gift Received', icon: 'Gift' },
  { name: 'Refund', icon: 'Coins' },
  { name: 'Other Income', icon: 'Wallet' },
];

export const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; icon: string }> = [
  { name: 'Food & Dining', icon: 'UtensilsCrossed' },
  { name: 'Groceries', icon: 'ShoppingBasket' },
  { name: 'Transportation', icon: 'Car' },
  { name: 'Fuel', icon: 'Fuel' },
  { name: 'Utilities', icon: 'Zap' },
  { name: 'Internet', icon: 'Wifi' },
  { name: 'Mobile Package', icon: 'Smartphone' },
  { name: 'Rent', icon: 'Home' },
  { name: 'Mortgage', icon: 'Landmark' },
  { name: 'Healthcare', icon: 'HeartPulse' },
  { name: 'Insurance', icon: 'ShieldCheck' },
  { name: 'Education', icon: 'GraduationCap' },
  { name: 'Clothing', icon: 'Shirt' },
  { name: 'Entertainment', icon: 'Clapperboard' },
  { name: 'Subscriptions', icon: 'Repeat' },
  { name: 'Travel', icon: 'Plane' },
  { name: 'Family Support', icon: 'HandCoins' },
  { name: 'Charity', icon: 'HeartHandshake' },
  { name: 'Personal Care', icon: 'Sparkles' },
  { name: 'Shopping', icon: 'ShoppingBag' },
  { name: 'Fitness', icon: 'Dumbbell' },
  { name: 'Emergency', icon: 'TriangleAlert' },
  { name: 'Miscellaneous', icon: 'MoreHorizontal' },
];

// Builds the full Category objects (minus id/userId, added at save time) ready to seed
// a new user's Firestore categories collection.
export const buildSeedCategories = (): Array<Omit<Category, 'id' | 'userId'>> => {
  const income = DEFAULT_INCOME_CATEGORIES.map((c, i) => ({
    name: c.name, type: 'Income' as const, icon: c.icon, isArchived: false, isDefault: true, sortOrder: i,
  }));
  const expense = DEFAULT_EXPENSE_CATEGORIES.map((c, i) => ({
    name: c.name, type: 'Expense' as const, icon: c.icon, isArchived: false, isDefault: true, sortOrder: i,
  }));
  return [...income, ...expense];
};
