import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore/lite';
import { firebaseAuth, firebaseDb, firebaseEnabled } from '../../services/firebase';
import { clearSession, getSession, saveSession } from '../../utils/session';

const normalizeSession = (token, profile) => ({
  token,
  user: profile,
});

const USERS_COLLECTION = 'users';

const getUserDocRef = (uid) => doc(firebaseDb, USERS_COLLECTION, uid);

const buildActivityPayload = ({ user, type, details = {} }) => ({
  uid: user.uid,
  role: user.role,
  email: user.email || '',
  type,
  details,
  createdAt: new Date().toISOString(),
  createdAtMs: Date.now(),
});

const saveUserProfile = async (uid, profile) => {
  await setDoc(getUserDocRef(uid), profile, { merge: true });
};

const fetchUserProfile = async (uid) => {
  const snapshot = await getDoc(getUserDocRef(uid));
  if (!snapshot.exists()) {
    const error = new Error(
      'No profile was found for this account. Please create an account first.',
    );
    error.status = 404;
    throw error;
  }

  return snapshot.data();
};

export const isFirebaseConfigured = () =>
  firebaseEnabled && Boolean(firebaseAuth) && Boolean(firebaseDb);

export const registerWithFirebase = async ({
  email,
  password,
  role,
  profile,
}) => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add the Firebase web config to the environment first.',
    );
  }

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  );
  const token = await credential.user.getIdToken();
  const now = new Date().toISOString();
  const normalizedProfile = {
    uid: credential.user.uid,
    role,
    email,
    fullName: profile.fullName || profile.name || '',
    department: profile.department || '',
    semester: role === 'student' ? profile.semester || '' : '',
    section: role === 'student' ? profile.section || '' : '',
    studentId: role === 'student' ? profile.studentId || '' : '',
    employeeId: role === 'teacher' ? profile.employeeId || '' : '',
    designation: role === 'teacher' ? profile.designation || 'Teacher' : '',
    createdAt: now,
    updatedAt: now,
  };

  await saveUserProfile(credential.user.uid, normalizedProfile);
  await addDoc(
    collection(firebaseDb, USERS_COLLECTION, credential.user.uid, 'activities'),
    buildActivityPayload({
      user: normalizedProfile,
      type: 'account_registered',
      details: {
        role,
        department: normalizedProfile.department,
      },
    }),
  );

  const session = normalizeSession(token, normalizedProfile);
  saveSession(session);
  return session;
};

export const signInWithFirebase = async ({ email, password }) => {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Add the Firebase web config to the environment first.',
    );
  }

  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  const token = await credential.user.getIdToken();
  const profile = await fetchUserProfile(credential.user.uid);
  await addDoc(
    collection(firebaseDb, USERS_COLLECTION, credential.user.uid, 'activities'),
    buildActivityPayload({
      user: profile,
      type: 'signed_in',
      details: {
        role: profile.role,
      },
    }),
  );

  const session = normalizeSession(token, profile);
  saveSession(session);
  return session;
};

export const updateAuthenticatedProfile = async ({
  profile,
  activityType,
}) => {
  const token = getSession()?.token;

  if (!token) {
    throw new Error('No authenticated session found.');
  }

  const currentSession = getSession();
  const currentUser = currentSession?.user;

  if (!currentUser?.uid) {
    throw new Error('No authenticated user profile found.');
  }

  const updates = {
    fullName: profile.fullName ?? currentUser.fullName ?? '',
    department: profile.department ?? currentUser.department ?? '',
    semester: currentUser.role === 'student' ? profile.semester ?? currentUser.semester ?? '' : '',
    section: currentUser.role === 'student' ? profile.section ?? currentUser.section ?? '' : '',
    studentId: currentUser.role === 'student' ? profile.studentId ?? currentUser.studentId ?? '' : '',
    employeeId: currentUser.role === 'teacher' ? profile.employeeId ?? currentUser.employeeId ?? '' : '',
    designation: currentUser.role === 'teacher' ? profile.designation ?? currentUser.designation ?? 'Teacher' : '',
    updatedAt: new Date().toISOString(),
  };

  await updateDoc(getUserDocRef(currentUser.uid), updates);
  const nextUser = {
    ...currentUser,
    ...updates,
  };

  await addDoc(
    collection(firebaseDb, USERS_COLLECTION, currentUser.uid, 'activities'),
    buildActivityPayload({
      user: nextUser,
      type: activityType || 'profile_updated',
      details: {
        updatedFields: Object.keys(profile),
      },
    }),
  );

  const nextSession = normalizeSession(token, nextUser);
  saveSession(nextSession);
  return nextSession;
};

export const recordAuthenticatedActivity = async ({ type, details, role }) => {
  const token = getSession()?.token;

  if (!token) {
    return null;
  }

  const currentUser = getSession()?.user;
  if (!currentUser?.uid) {
    return null;
  }

  const payload = buildActivityPayload({
    user: {
      ...currentUser,
      role: role || currentUser.role,
    },
    type,
    details,
  });

  await addDoc(
    collection(firebaseDb, USERS_COLLECTION, currentUser.uid, 'activities'),
    payload,
  );

  await updateDoc(getUserDocRef(currentUser.uid), {
    updatedAt: new Date().toISOString(),
    lastActivityAt: payload.createdAt,
    lastActivityType: type,
  });

  return payload;
};

export const getAuthenticatedActivities = async (limit = 20) => {
  const currentUser = getSession()?.user;

  if (!currentUser?.uid) {
    return [];
  }

  const activityQuery = query(
    collection(firebaseDb, USERS_COLLECTION, currentUser.uid, 'activities'),
    orderBy('createdAtMs', 'desc'),
    limitQuery(Math.min(Math.max(Number(limit) || 20, 1), 50)),
  );
  const snapshot = await getDocs(activityQuery);

  return snapshot.docs.map((activityDoc) => ({
    id: activityDoc.id,
    ...activityDoc.data(),
  }));
};

export const getCurrentSession = () => getSession();

export const logout = async () => {
  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
  clearSession();
};

export const initializeSessionListener = (onResolvedSession) => {
  if (!firebaseAuth) {
    return () => {};
  }

  return onAuthStateChanged(firebaseAuth, async (user) => {
    if (!user) {
      clearSession();
      onResolvedSession?.(null);
      return;
    }

    try {
      const token = await user.getIdToken();
      const profile = await fetchUserProfile(user.uid);
      const session = normalizeSession(token, profile);
      saveSession(session);
      onResolvedSession?.(session);
    } catch {
      onResolvedSession?.(getSession());
    }
  });
};
