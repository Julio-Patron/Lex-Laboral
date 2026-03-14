const {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} = require('@firebase/rules-unit-testing');
const fs = require('fs');

let testEnv;
const PROJECT_ID = 'studio-6462708856-c0f94';

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: fs.readFileSync('./firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Users Collection Rules', () => {
  const ALICE_UID = 'alice';
  const BOB_UID = 'bob';

  const validDoc = {
    email: 'alice@example.com',
    isPremium: true,
    licenseType: 'validation-bypass',
    accessUntil: '2026-03-20T00:00:00.000Z',
    usage: { audits: 0, generations: 0 },
    createdAt: '2026-03-13T00:00:00.000Z',
  };

  test('Alice can create her own valid user document', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertSucceeds(aliceDb.collection('users').doc(ALICE_UID).set(validDoc));
  });

  test('Alice cannot create a user document without required fields', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    const invalidDoc = {
      isPremium: true,
      // Missing licenseType, accessUntil, usage, createdAt
    };
    await assertFails(aliceDb.collection('users').doc(ALICE_UID).set(invalidDoc));
  });

  test('Alice cannot create a user document with wrong types', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    const invalidDoc = { ...validDoc, isPremium: 'yes' }; // Should be boolean
    await assertFails(aliceDb.collection('users').doc(ALICE_UID).set(invalidDoc));
  });

  test('Alice cannot create Bob’s user document', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertFails(aliceDb.collection('users').doc(BOB_UID).set(validDoc));
  });

  test('Unauthenticated user cannot create a user document', async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection('users').doc(ALICE_UID).set(validDoc));
  });

  test('Alice can read her own user document', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(ALICE_UID).set(validDoc);
    });

    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertSucceeds(aliceDb.collection('users').doc(ALICE_UID).get());
  });

  test('Alice cannot read Bob’s user document', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(BOB_UID).set(validDoc);
    });

    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertFails(aliceDb.collection('users').doc(BOB_UID).get());
  });

  test('Alice cannot update her own user document (backend only)', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(ALICE_UID).set(validDoc);
    });

    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertFails(aliceDb.collection('users').doc(ALICE_UID).update({ isPremium: false }));
  });

  test('Alice cannot delete her own user document', async () => {
    // Setup
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('users').doc(ALICE_UID).set(validDoc);
    });

    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertFails(aliceDb.collection('users').doc(ALICE_UID).delete());
  });
  
  test('Cannot write to random collections', async () => {
    const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
    await assertFails(aliceDb.collection('secret_data').doc('document').set({ secret: true }));
  });
});
