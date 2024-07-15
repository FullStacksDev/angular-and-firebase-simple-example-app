import { Injectable } from '@angular/core';
import { collectionData$, injectFirestore } from '@app-shared/firebase/firestore';
import { createLogger } from '@app-shared/logger';
import { EntriesFilters, EntryDoc, NewOrUpdatedEntryInput, PageCursor } from '@app-shared/models';
import {
  FirestoreDataConverter,
  QueryConstraint,
  addDoc,
  collection,
  deleteDoc,
  doc,
  endAt,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAt,
  updateDoc,
  where,
} from 'firebase/firestore';
import { Observable, from, map, tap } from 'rxjs';

const logger = createLogger('EntriesService');

@Injectable({
  providedIn: 'root',
})
export class EntriesService {
  readonly #firestore = injectFirestore();

  readonly #docConverter: FirestoreDataConverter<EntryDoc> = {
    toFirestore: (obj) => {
      // We need to remove the `id` field before persisting the document
      const { id, ...rest } = obj;
      return rest;
    },
    fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);

      const obj = {
        id: snapshot.id,
        ...data,
      } as EntryDoc;

      return obj;
    },
  };

  readonly #collectionRef = collection(this.#firestore, 'entries').withConverter(
    this.#docConverter,
  );

  getEntryDocs$(
    userId: string,
    pageSize: number,
    pageCursor: PageCursor,
    filters: EntriesFilters,
  ): Observable<EntryDoc[]> {
    logger.debug('getEntryDocs$ - inputs:', { userId, pageSize, pageCursor, filters });

    const q = this.#buildQuery(userId, pageSize, pageCursor, filters);
    return collectionData$(q).pipe(
      tap((entries) => logger.debug('getEntryDocs$ - entries from Firestore:', entries)),
    );
  }

  createEntryDoc$(userId: string, data: NewOrUpdatedEntryInput): Observable<string> {
    logger.debug('createEntryDoc$ - inputs:', { userId, data });

    // Make sure we never store `undefined` or empty string in the `category` field
    const category =
      typeof data.category === 'undefined' || data.category === '' ? null : data.category;

    const docData = {
      ...data,
      category,
      userId,
      timestamp: serverTimestamp(),
    };

    const promise = addDoc(this.#collectionRef, docData);
    return from(promise).pipe(map((docRef) => docRef.id));
  }

  updateEntryDoc$(entryId: string, data: NewOrUpdatedEntryInput): Observable<void> {
    logger.debug('updateEntryDoc$ - inputs:', { entryId, data });

    const docRef = doc(this.#collectionRef, entryId);
    const promise = updateDoc(docRef, data);
    return from(promise);
  }

  deleteEntryDoc$(entryId: string): Observable<void> {
    logger.debug('deleteEntryDoc$ - entryId:', entryId);

    const docRef = doc(this.#collectionRef, entryId);
    const promise = deleteDoc(docRef);
    return from(promise);
  }

  #buildQuery(userId: string, pageSize: number, pageCursor: PageCursor, filters: EntriesFilters) {
    const queryParts: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(pageSize),
    ];

    if (pageCursor.startAt) {
      queryParts.push(startAt(pageCursor.startAt));
    } else if (pageCursor.endAt) {
      queryParts.push(endAt(pageCursor.endAt));
    }

    if ('category' in filters && (filters.category === null || filters.category)) {
      queryParts.push(where('category', '==', filters.category));
    }

    return query(this.#collectionRef, ...queryParts);
  }
}
