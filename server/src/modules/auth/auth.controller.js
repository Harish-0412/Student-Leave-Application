const authService = require('./auth.service');

const registerProfile = async (req, res, next) => {
  try {
    const user = await authService.registerProfile({
      authUser: req.firebaseUser,
      role: req.body.role,
      profile: req.body.profile || {},
    });

    res.status(201).json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
};

const getSession = async (req, res, next) => {
  try {
    const user = await authService.getSession({
      authUser: req.firebaseUser,
      logActivity: Boolean(req.body?.logActivity),
    });

    res.json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile({
      authUser: req.firebaseUser,
      profile: req.body.profile || {},
      activityType: req.body.activityType || 'profile_updated',
    });

    res.json({ ok: true, data: user });
  } catch (error) {
    next(error);
  }
};

const recordActivity = async (req, res, next) => {
  try {
    const activity = await authService.recordActivity({
      authUser: req.firebaseUser,
      type: req.body.type,
      details: req.body.details || {},
      role: req.body.role,
    });

    res.status(201).json({ ok: true, data: activity });
  } catch (error) {
    next(error);
  }
};

const listActivities = async (req, res, next) => {
  try {
    const activities = await authService.listActivities({
      authUser: req.firebaseUser,
      limit: req.query.limit,
    });

    res.json({ ok: true, data: activities });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerProfile,
  getSession,
  updateProfile,
  recordActivity,
  listActivities,
};
