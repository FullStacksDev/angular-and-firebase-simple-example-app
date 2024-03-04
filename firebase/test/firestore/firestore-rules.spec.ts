import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createWriteStream, readFileSync } from 'node:fs';
import { get as httpGet } from 'node:http';
import { afterAll, beforeAll, beforeEach, describe, test } from 'vitest';
import { TEST_PROJECT_ID } from '../helpers/constants';
import { getFirestoreMeta } from '../helpers/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  // Silence expected rules rejections from Firestore SDK. Unexpected rejections
  // will still bubble up and will be thrown as an error (failing the tests as needed).
  setLogLevel('error');
  const { host, port } = getFirestoreMeta(TEST_PROJECT_ID);
  testEnv = await initializeTestEnvironment({
    projectId: TEST_PROJECT_ID,
    firestore: {
      host,
      port,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();

  // Write the coverage report to a file
  const { coverageUrl } = getFirestoreMeta(TEST_PROJECT_ID);
  const coverageFile = './firestore-coverage.html';
  const fstream = createWriteStream(coverageFile);
  await new Promise((resolve, reject) => {
    httpGet(coverageUrl, (res) => {
      res.pipe(fstream, { end: true });
      res.on('end', resolve);
      res.on('error', reject);
    });
  });
  console.log(`View firestore rule coverage information at ${coverageFile}\n`);
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Firestore security rules', () => {
  test('does not allow any reads, writes or deletes to an unused collection by an unauthenticated user', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const docRef = doc(db, 'unused/1');

    await assertFails(getDoc(docRef));

    await assertFails(setDoc(docRef, { name: 'someone' }));

    await assertFails(deleteDoc(docRef));
  });

  test('does not allow any reads, writes or deletes to an unused collection by an authenticated user', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const docRef = doc(db, 'unused/1');

    await assertFails(getDoc(docRef));

    await assertFails(setDoc(docRef, { name: 'someone' }));

    await assertFails(deleteDoc(docRef));
  });

  test("does not allow any reads, writes or deletes to the 'entries' collection by an unauthenticated user", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    const collectionRef = collection(db, 'entries');

    await assertFails(getDocs(collectionRef));
  });

  test("allows listing the 'entries' collection by an authenticated user but only for their own entries", async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    const aliceAccessingAliceEntriesQuery = query(
      collection(aliceDb, 'entries'),
      where('userId', '==', 'alice'),
    );

    await assertSucceeds(getDocs(aliceAccessingAliceEntriesQuery));

    const bobAccessingAliceEntriesQuery = query(
      collection(bobDb, 'entries'),
      where('userId', '==', 'alice'),
    );

    await assertFails(getDocs(bobAccessingAliceEntriesQuery));
  });

  test("allows reads, writes and deletes to the 'entries' collection by an authenticated user but only for their own entries", async () => {
    const aliceEntryId = '1234';
    const bobEntryId = '5678';

    await testEnv.withSecurityRulesDisabled(async (env) => {
      const firestore = env.firestore();

      await setDoc(doc(firestore, 'entries', aliceEntryId), { userId: 'alice' });
      await setDoc(doc(firestore, 'entries', bobEntryId), { userId: 'bob' });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();

    const aliceAccessingEntriesCollection = collection(aliceDb, 'entries');
    const bobAccessingEntriesCollection = collection(bobDb, 'entries');

    const aliceAccessingAliceEntryRef = doc(aliceAccessingEntriesCollection, aliceEntryId);
    const bobAccessingAliceEntryRef = doc(bobAccessingEntriesCollection, aliceEntryId);
    const bobAccessingBobEntryRef = doc(bobAccessingEntriesCollection, bobEntryId);

    // Reads
    await assertSucceeds(getDoc(aliceAccessingAliceEntryRef));
    await assertFails(getDoc(bobAccessingAliceEntryRef));
    await assertSucceeds(getDoc(bobAccessingBobEntryRef));

    // Creates
    await assertSucceeds(
      addDoc(aliceAccessingEntriesCollection, { content: 'Hello world', userId: 'alice' }),
    );
    await assertFails(
      addDoc(bobAccessingEntriesCollection, { content: 'Hello world', userId: 'alice' }),
    );
    await assertSucceeds(
      addDoc(bobAccessingEntriesCollection, { content: 'Hello world', userId: 'bob' }),
    );

    // Updates
    await assertSucceeds(
      updateDoc(aliceAccessingAliceEntryRef, { content: 'Hello world updated' }),
    );
    await assertFails(updateDoc(bobAccessingAliceEntryRef, { content: 'Hello world updated' }));
    await assertSucceeds(updateDoc(bobAccessingBobEntryRef, { content: 'Hello world updated' }));

    // Deletes
    await assertSucceeds(deleteDoc(aliceAccessingAliceEntryRef));
    await assertFails(deleteDoc(bobAccessingAliceEntryRef));
    await assertSucceeds(deleteDoc(bobAccessingBobEntryRef));
  });

  test('does not allow changing the userId on an existing entry', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const entryRef = doc(db, 'entries', '1234');

    await assertFails(setDoc(entryRef, { userId: 'bob' }, { merge: true }));
  });
});
