const { getFirestore, isFirebaseAdminEnabled } = require('../../config/firebase-admin');

const USERS_COLLECTION = 'users';
const ACTIVITIES_SUBCOLLECTION = 'activities';
const VALID_ROLES = new Set(['student', 'teacher']);

const ensureFirebase = () => {
  if (!isFirebaseAdminEnabled()) {
    const error = new Error(
      'Firebase Admin is not configured. Add the Firebase service credentials to continue.',
    );
    error.status = 503;
    throw error;
  }
};

const sanitizeRole = (role = '') => role.trim().toLowerCase();

const validateRole = (role = '') => {
  const normalizedRole = sanitizeRole(role);

  if (!VALID_ROLES.has(normalizedRole)) {
    const error = new Error('Role must be either student or teacher.');
    error.status = 400;
    throw error;
  }

  return normalizedRole;
};

const buildBaseUserRecord = ({ authUser, role, profile = {} }) => ({
  uid: authUser.uid,
  role,
  email: authUser.email || profile.email || '',
  fullName: profile.fullName || profile.name || authUser.name || '',
  department: profile.department || '',
  semester: profile.semester || '',
  section: profile.section || '',
  studentId: role === 'student' ? profile.studentId || '' : '',
  employeeId: role === 'teacher' ? profile.employeeId || '' : '',
  designation: role === 'teacher' ? profile.designation || 'Teacher' : '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const getUserDocumentRef = (uid) =>
  getFirestore().collection(USERS_COLLECTION).doc(uid);

const recordActivity = async ({
  authUser,
  type,
  details = {},
  role,
}) => {
  ensureFirebase();

  const normalizedRole = role ? validateRole(role) : undefined;
  const db = getFirestore();
  const userRef = db.collection(USERS_COLLECTION).doc(authUser.uid);
  const timestamp = new Date().toISOString();

  const userSnapshot = await userRef.get();
  const resolvedRole =
    normalizedRole || (userSnapshot.exists ? userSnapshot.data()?.role : '') || 'student';

  const activityRecord = {
    type,
    details,
    role: resolvedRole,
    uid: authUser.uid,
    email: authUser.email || '',
    createdAt: timestamp,
    createdAtMs: Date.now(),
  };

  await userRef.collection(ACTIVITIES_SUBCOLLECTION).add(activityRecord);
  await userRef.set(
    {
      updatedAt: timestamp,
      lastActivityAt: timestamp,
      lastActivityType: type,
      role: resolvedRole,
      email: authUser.email || '',
    },
    { merge: true },
  );

  return activityRecord;
};

const registerProfile = async ({ authUser, role, profile = {} }) => {
  ensureFirebase();

  const normalizedRole = validateRole(role);
  const userRef = getUserDocumentRef(authUser.uid);
  const existingSnapshot = await userRef.get();
  const baseRecord = buildBaseUserRecord({
    authUser,
    role: normalizedRole,
    profile,
  });

  if (existingSnapshot.exists) {
    const existingData = existingSnapshot.data();
    if (existingData.role && existingData.role !== normalizedRole) {
      const error = new Error(
        `This account is already registered as ${existingData.role}.`,
      );
      error.status = 409;
      throw error;
    }
  }

  await userRef.set(
    existingSnapshot.exists
      ? {
          ...baseRecord,
          createdAt: existingSnapshot.data().createdAt || baseRecord.createdAt,
        }
      : baseRecord,
    { merge: true },
  );

  await recordActivity({
    authUser,
    type: 'account_registered',
    details: {
      role: normalizedRole,
      department: profile.department || '',
    },
    role: normalizedRole,
  });

  const savedSnapshot = await userRef.get();
  return savedSnapshot.data();
};

const getSession = async ({ authUser, logActivity = false }) => {
  ensureFirebase();

  const userRef = getUserDocumentRef(authUser.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const error = new Error(
      'No profile was found for this Firebase account. Please complete registration first.',
    );
    error.status = 404;
    throw error;
  }

  const userRecord = snapshot.data();

  if (logActivity) {
    await recordActivity({
      authUser,
      type: 'signed_in',
      details: {
        role: userRecord.role,
      },
      role: userRecord.role,
    });
  }

  return userRecord;
};

const updateProfile = async ({ authUser, profile = {}, activityType = 'profile_updated' }) => {
  ensureFirebase();

  const userRef = getUserDocumentRef(authUser.uid);
  const snapshot = await userRef.get();

  if (!snapshot.exists) {
    const error = new Error('User profile not found.');
    error.status = 404;
    throw error;
  }

  const current = snapshot.data();
  const updates = {
    fullName: profile.fullName ?? current.fullName ?? '',
    department: profile.department ?? current.department ?? '',
    semester: profile.semester ?? current.semester ?? '',
    section: profile.section ?? current.section ?? '',
    designation: profile.designation ?? current.designation ?? '',
    studentId:
      current.role === 'student'
        ? profile.studentId ?? current.studentId ?? ''
        : '',
    employeeId:
      current.role === 'teacher'
        ? profile.employeeId ?? current.employeeId ?? ''
        : '',
    updatedAt: new Date().toISOString(),
  };

  await userRef.set(updates, { merge: true });

  await recordActivity({
    authUser,
    type: activityType,
    details: {
      updatedFields: Object.keys(profile),
    },
    role: current.role,
  });

  const updatedSnapshot = await userRef.get();
  return updatedSnapshot.data();
};

const listActivities = async ({ authUser, limit = 20 }) => {
  ensureFirebase();

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const activitiesSnapshot = await getUserDocumentRef(authUser.uid)
    .collection(ACTIVITIES_SUBCOLLECTION)
    .orderBy('createdAtMs', 'desc')
    .limit(safeLimit)
    .get();

  return activitiesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

module.exports = {
  registerProfile,
  getSession,
  updateProfile,
  recordActivity,
  listActivities,
};
