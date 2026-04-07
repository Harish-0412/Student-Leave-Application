const { getFirebaseAuth, isFirebaseAdminEnabled } = require('../../config/firebase-admin');

const firebaseAuth = async (req, res, next) => {
  if (!isFirebaseAdminEnabled()) {
    return res.status(503).json({
      error:
        'Firebase Admin is not configured on the server. Add Firebase service credentials to the environment first.',
    });
  }

  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';

  if (!token) {
    return res.status(401).json({ error: 'Missing Firebase ID token.' });
  }

  try {
    const auth = getFirebaseAuth();
    const decodedToken = await auth.verifyIdToken(token);
    req.firebaseUser = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired Firebase token.' });
  }
};

module.exports = firebaseAuth;
