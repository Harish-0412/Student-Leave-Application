const admin = require('firebase-admin');
const {
  FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_STORAGE_BUCKET,
} = require('./env');

const normalizePrivateKey = (value = '') => value.replace(/\\n/g, '\n').trim();

const hasFirebaseCredentials = () =>
  Boolean(
    FIREBASE_PROJECT_ID &&
      FIREBASE_CLIENT_EMAIL &&
      normalizePrivateKey(FIREBASE_PRIVATE_KEY),
  );

const initializeFirebaseAdmin = () => {
  if (!hasFirebaseCredentials()) {
    return null;
  }

  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(FIREBASE_PRIVATE_KEY),
    }),
    storageBucket: FIREBASE_STORAGE_BUCKET || undefined,
  });
};

const getFirebaseAdminApp = () => initializeFirebaseAdmin();

const getFirebaseAuth = () => {
  const app = getFirebaseAdminApp();
  return app ? admin.auth(app) : null;
};

const getFirestore = () => {
  const app = getFirebaseAdminApp();
  return app ? admin.firestore(app) : null;
};

module.exports = {
  isFirebaseAdminEnabled: hasFirebaseCredentials,
  getFirebaseAdminApp,
  getFirebaseAuth,
  getFirestore,
};
