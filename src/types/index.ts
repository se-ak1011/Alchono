import type { Database } from './database';

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Profile = Tables<'profiles'>;
export type DailyCheckin = Tables<'daily_checkins'>;
export type DrinkingSession = Tables<'drinking_sessions'>;
export type JournalEntry = Tables<'journal_entries'>;
export type CommunityPost = Tables<'community_posts'>;
export type MentorProfile = Tables<'mentor_profiles'>;
export type MentorRequest = Tables<'mentor_requests'>;
export type AiConversation = Tables<'ai_conversations'>;
export type NotificationPreference = Tables<'notification_preferences'>;

export type MoodOption = {
  emoji: string;
  label: string;
  value: string;
};

export const MOOD_OPTIONS: MoodOption[] = [
  { emoji: '😊', label: 'Good', value: 'good' },
  { emoji: '😐', label: 'Okay', value: 'okay' },
  { emoji: '😔', label: 'Struggling', value: 'struggling' },
  { emoji: '😡', label: 'Angry', value: 'angry' },
  { emoji: '😰', label: 'Anxious', value: 'anxious' },
  { emoji: '🥱', label: 'Exhausted', value: 'exhausted' },
];

export const JOURNAL_TRIGGERS = [
  'Work',
  'Relationship',
  'Stress',
  'Celebration',
  'Habit',
  'Loneliness',
  'Pain',
  'Other',
] as const;

export const JOURNAL_AFFECTED = [
  'Partner',
  'Child',
  'Friend',
  'Family',
  'Nobody',
] as const;

export const MENTOR_LEVELS = [
  { label: '30 Days', value: '30_days', days: 30 },
  { label: '6 Months', value: '6_months', days: 180 },
  { label: '1 Year', value: '1_year', days: 365 },
  { label: '5 Years', value: '5_years', days: 1825 },
] as const;

export const PAUSE_ACTIONS = [
  { icon: '💧', label: 'Drink water', value: 'water' },
  { icon: '🚶', label: 'Walk outside', value: 'walk' },
  { icon: '🌬️', label: 'Breathing exercise', value: 'breathe' },
  { icon: '💬', label: 'Message someone', value: 'message' },
  { icon: '🍷', label: 'Continue drinking', value: 'continue' },
] as const;

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type AppError = {
  message: string;
  code?: string;
};
