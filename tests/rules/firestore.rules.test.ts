import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeAll, afterAll, afterEach, describe, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const PROJECT_ID = 'demo-expenzo-rules-test';
const OWNER_UID = 'alice';
const OTHER_UID = 'bob';
const DOC_ID = 'doc-1';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

async function seed(collectionName: string, data: Record<string, unknown>) {
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), collectionName, DOC_ID), data);
  });
}

// Every collection actually read/written by src/firebase/db.ts where each
// document carries its own userId field (as opposed to /settings/{userId},
// tested separately below, where the uid IS the document ID).
const USER_OWNED_COLLECTIONS = [
  'accounts',
  'transactions',
  'budgets',
  'goals',
  'notifications',
  'recurringRules',
  'categories',
] as const;

describe.each(USER_OWNED_COLLECTIONS)('firestore.rules: %s', (collectionName) => {
  it('lets the owner read their own document', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(getDoc(doc(ownerDb, collectionName, DOC_ID)));
  });

  it('lets the owner create a document assigned to themself', async () => {
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(
      setDoc(doc(ownerDb, collectionName, DOC_ID), { userId: OWNER_UID, name: 'created' })
    );
  });

  it('lets the owner update their own document without changing userId', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(updateDoc(doc(ownerDb, collectionName, DOC_ID), { name: 'updated' }));
  });

  it('lets the owner delete their own document', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(deleteDoc(doc(ownerDb, collectionName, DOC_ID)));
  });

  it("blocks another user from reading the owner's document", async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(getDoc(doc(otherDb, collectionName, DOC_ID)));
  });

  it("blocks another user from updating the owner's document", async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(updateDoc(doc(otherDb, collectionName, DOC_ID), { name: 'hacked' }));
  });

  it("blocks another user from deleting the owner's document", async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(deleteDoc(doc(otherDb, collectionName, DOC_ID)));
  });

  it('blocks a user from creating a document assigned to someone else', async () => {
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(
      setDoc(doc(otherDb, collectionName, DOC_ID), {
        userId: OWNER_UID,
        name: 'created-for-someone-else',
      })
    );
  });

  it('blocks the owner from reassigning userId to another user via update', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertFails(updateDoc(doc(ownerDb, collectionName, DOC_ID), { userId: OTHER_UID }));
  });

  it('rejects an unauthenticated read', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonDb, collectionName, DOC_ID)));
  });

  it('rejects an unauthenticated create', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(anonDb, collectionName, DOC_ID), { userId: OWNER_UID, name: 'created' })
    );
  });

  it('rejects an unauthenticated update', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(updateDoc(doc(anonDb, collectionName, DOC_ID), { name: 'hacked' }));
  });

  it('rejects an unauthenticated delete', async () => {
    await seed(collectionName, { userId: OWNER_UID, name: 'seed' });
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(deleteDoc(doc(anonDb, collectionName, DOC_ID)));
  });
});

// /settings/{userId} uses a different pattern: the document ID IS the owner's
// uid (there's no separate userId field driving the rule), so it gets its own
// set of equivalent checks rather than being folded into the loop above.
describe('firestore.rules: settings (doc ID = uid)', () => {
  it('lets the owner read their own settings document', async () => {
    await seed('settings', { userId: OWNER_UID, currency: 'USD' });
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(getDoc(doc(ownerDb, 'settings', OWNER_UID)));
  });

  it('lets the owner create/update their own settings document', async () => {
    const ownerDb = testEnv.authenticatedContext(OWNER_UID).firestore();
    await assertSucceeds(setDoc(doc(ownerDb, 'settings', OWNER_UID), { userId: OWNER_UID, currency: 'USD' }));
    await assertSucceeds(setDoc(doc(ownerDb, 'settings', OWNER_UID), { userId: OWNER_UID, currency: 'EUR' }));
  });

  it("blocks another user from reading the owner's settings document", async () => {
    await seed('settings', { userId: OWNER_UID, currency: 'USD' });
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(getDoc(doc(otherDb, 'settings', OWNER_UID)));
  });

  it("blocks another user from writing the owner's settings document", async () => {
    const otherDb = testEnv.authenticatedContext(OTHER_UID).firestore();
    await assertFails(setDoc(doc(otherDb, 'settings', OWNER_UID), { userId: OWNER_UID, currency: 'HACKED' }));
  });

  it('rejects an unauthenticated read of a settings document', async () => {
    await seed('settings', { userId: OWNER_UID, currency: 'USD' });
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(anonDb, 'settings', OWNER_UID)));
  });

  it('rejects an unauthenticated write of a settings document', async () => {
    const anonDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(setDoc(doc(anonDb, 'settings', OWNER_UID), { userId: OWNER_UID, currency: 'HACKED' }));
  });
});
