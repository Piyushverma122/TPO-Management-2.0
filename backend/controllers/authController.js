const authService = require('../services/authService');
const { sendSuccess, sendError } = require('../utils/responseHandler');

/**
 * @desc    Register a new user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { email, password, full_name, role, phone, department } = req.body;
    const result = await authService.registerUser({
      email,
      password,
      full_name,
      role,
      phone,
      department,
    });
    return sendSuccess(res, 'User registered successfully', result, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & return JWT token + user profile
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    return sendSuccess(res, 'Login successful', result, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current authenticated user profile
 * @route   GET /api/v1/auth/me
 * @access  Private (Authenticated)
 */
const getMe = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userProfile = await authService.getCurrentUserProfile(userId);
    return sendSuccess(res, 'User profile retrieved', { user: userProfile }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user & invalidate session
 * @route   POST /api/v1/auth/logout
 * @access  Private (Authenticated)
 */
const logout = async (req, res, next) => {
  try {
    await authService.logoutUser();
    return sendSuccess(res, 'Logged out successfully', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Request password reset email
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    return sendSuccess(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset user password
 * @route   POST /api/v1/auth/reset-password
 * @access  Private (Authenticated)
 */
const resetPassword = async (req, res, next) => {
  try {
    const { new_password } = req.body;
    const result = await authService.resetPassword(new_password);
    return sendSuccess(res, result.message, null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Refresh session token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    const result = await authService.refreshSession(refresh_token);
    return sendSuccess(res, 'Token refreshed successfully', result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
};
