import { WithId } from '@common';
import { Timestamp } from 'firebase/firestore';
import { EmptyObject } from 'type-fest';

export type EmptyPageCursor = { startAt: null; endAt: null };
export type PageCursor =
  | EmptyPageCursor
  | { startAt: Timestamp; endAt: null }
  | { startAt: null; endAt: Timestamp };

export type Config = Readonly<{
  categories: string[];
}>;

export type EntryDoc = Readonly<
  WithId & {
    userId: string;
    timestamp: Timestamp;
    title: string;
    text: string;
    category: string | null;
  }
>;

export type NewOrUpdatedEntryInput = Pick<EntryDoc, 'title' | 'text' | 'category'>;

export type EmptyEntriesFilters = EmptyObject;
export type EntriesFilters = EmptyEntriesFilters | { category: string | null };
