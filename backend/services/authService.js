const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const env = require('../config/env');

/**
 * Register user with Supabase Auth & create profile in public.users
 */
const registerUser = async ({ email, password, full_name, role = 'student', phone, department }) => {
  // 1. Check if email already exists in public.users
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    const error = new Error('User with this email already exists.');
    error.statusCode = 409;
    throw error;
  }

  // 2. Register user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, role },
    },
  });

  if (authError) {
    const error = new Error(authError.message);
    error.statusCode = 400;
    throw error;
  }

  const authUserId = authData.user?.id;
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Store user record in public.users table
  const { data: newUser, error: dbError } = await supabase
    .from('users')
    .insert([
      {
        id: authUserId,
        email,
        password_hash: passwordHash,
        full_name,
        role,
        phone: phone || null,
        is_active: true,
        email_verified: false,
      },
    ])
    .select('id, email, full_name, role, phone, avatar_url, is_active, created_at')
    .single();

  if (dbError) {
    const error = new Error(dbError.message);
    error.statusCode = 500;
    throw error;
  }

  // Generate local JWT token if Supabase session is pending confirmation
  const accessToken = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    user: newUser,
    session: {
      access_token: authData.session?.access_token || accessToken,
      refresh_token: authData.session?.refresh_token || null,
      expires_in: authData.session?.expires_in || 604800,
    },
  };
};

/**
 * Authenticate user credentials with Supabase Auth & fetch profile
 */
const loginUser = async ({ email, password }) => {
  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    const error = new Error(authError.message);
    error.statusCode = 401;
    throw error;
  }

  const userId = authData.user.id;

  // 2. Fetch user profile from public.users
  let { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('id, email, full_name, role, phone, avatar_url, is_active, created_at')
    .eq('id', userId)
    .maybeSingle();

  // Auto-provision profile in public.users if missing
  if (!userProfile) {
    const metaRole = authData.user.user_metadata?.role ||
      (email.startsWith('admin') ? 'admin' :
       email.startsWith('tpo') ? 'tpo' :
       email.startsWith('recruiter') ? 'recruiter' :
       email.startsWith('faculty') ? 'faculty' : 'student');

    const fullName = authData.user.user_metadata?.full_name || email.split('@')[0];

    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert([{
        id: userId,
        email: authData.user.email || email,
        password_hash: 'SUPABASE_MANAGED_AUTH',
        full_name: fullName,
        role: metaRole,
        is_active: true,
        email_verified: !!authData.user.email_confirmed_at,
      }])
      .select('id, email, full_name, role, phone, avatar_url, is_active, created_at')
      .single();

    if (createError || !newProfile) {
      const error = new Error('User profile not found in system database and auto-creation failed.');
      error.statusCode = 500;
      throw error;
    }

    userProfile = newProfile;
  }

  if (!userProfile.is_active) {
    const error = new Error('Your account has been deactivated. Please contact TPO admin.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Update last_login timestamp
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId);

  // Sign custom JWT carrying full role permissions
  const token = jwt.sign(
    { id: userProfile.id, email: userProfile.email, role: userProfile.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

  return {
    user: userProfile,
    accessToken: token,
    session: {
      access_token: authData.session?.access_token || token,
      refresh_token: authData.session?.refresh_token || null,
      expires_in: authData.session?.expires_in || 604800,
      token_type: 'Bearer',
    },
  };
};

/**
 * Fetch authenticated user profile
 */
const getCurrentUserProfile = async (userId) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, full_name, role, phone, avatar_url, is_active, last_login, created_at')
    .eq('id', userId)
    .single();

  if (error || !user) {
    const err = new Error('User profile not found');
    err.statusCode = 404;
    throw err;
  }

  return user;
};

/**
 * Logout user session via Supabase Auth
 */
const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.warn('Supabase auth signOut warning:', error.message);
  }
  return true;
};

/**
 * Trigger forgot password email via Supabase Auth
 */
const forgotPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${env.clientUrl}/reset-password`,
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { message: 'Password reset link sent to registered email address.' };
};

/**
 * Reset password for authenticated session
 */
const resetPassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 400;
    throw err;
  }

  return { message: 'Password updated successfully.' };
};

/**
 * Refresh access token using refresh_token
 */
const refreshSession = async (refreshToken) => {
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 401;
    throw err;
  }

  return {
    access_token: data.session?.access_token,
    refresh_token: data.session?.refresh_token,
    expires_in: data.session?.expires_in,
  };
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  logoutUser,
  forgotPassword,
  resetPassword,
  refreshSession,
};
