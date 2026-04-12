const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const https = require('https');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const sendResponse = (res, status, user, token) =>
  res.status(status).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
  });

const createTransporter = () =>
  nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

const getGoogleUserInfo = (accessToken) =>
  new Promise((resolve, reject) => {
    const req = https.get(
      { hostname: 'www.googleapis.com', path: '/oauth2/v3/userinfo',
        headers: { Authorization: `Bearer ${accessToken}` } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
      }
    );
    req.on('error', reject);
  });

const exchangeGoogleCode = (code, redirectUri) =>
  new Promise((resolve, reject) => {
    const body = JSON.stringify({
      code, client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri, grant_type: 'authorization_code',
    });
    const req = https.request(
      { hostname: 'oauth2.googleapis.com', path: '/token', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });

// ─── Register ─────────────────────────────────────────────────────────────────

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required.' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });

    const user = await User.create({ name, email, password, authProvider: 'local' });
    sendResponse(res, 201, user, signToken(user._id));
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ error: 'Email already in use.' });
    res.status(500).json({ error: err.message });
  }
});

// ─── Login ────────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password are required.' });

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    if (user.authProvider === 'google' && !user.password) {
      return res.status(400).json({ error: 'This account uses Google Sign-In. Please sign in with Google.' });
    }

    if (!(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password.' });

    sendResponse(res, 200, user, signToken(user._id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Me ───────────────────────────────────────────────────────────────────────

router.get('/me', protect, (req, res) => {
  const u = req.user;
  res.json({ user: { id: u._id, name: u.name, email: u.email, avatar: u.avatar } });
});

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/google
 * Body: { accessToken } OR { code, redirectUri }
 */
router.post('/google', async (req, res) => {
  try {
    const { accessToken, code, redirectUri } = req.body;
    let googleUser;

    if (accessToken) {
      googleUser = await getGoogleUserInfo(accessToken);
    } else if (code) {
      const uri = redirectUri || 'https://personal-finance-tracker-sovit.netlify.app/auth/callback';
      const tokens = await exchangeGoogleCode(code, uri);
      if (tokens.error) return res.status(400).json({ error: tokens.error_description || 'Google auth failed.' });
      googleUser = await getGoogleUserInfo(tokens.access_token);
    } else {
      return res.status(400).json({ error: 'accessToken or code is required.' });
    }

    if (!googleUser.email) return res.status(400).json({ error: 'Could not get email from Google.' });

    let user = await User.findOne({ email: googleUser.email });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleUser.sub;
        user.authProvider = 'google';
        if (!user.avatar && googleUser.picture) user.avatar = googleUser.picture;
        await user.save();
      }
    } else {
      user = await User.create({
        name: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        googleId: googleUser.sub,
        authProvider: 'google',
        avatar: googleUser.picture || '',
        isVerified: googleUser.email_verified || false,
      });
    }

    sendResponse(res, 200, user, signToken(user._id));
  } catch (err) {
    console.error('Google auth error:', err.message);
    res.status(500).json({ error: 'Google authentication failed. ' + err.message });
  }
});

// ─── Forgot Password ──────────────────────────────────────────────────────────

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  const successMsg = { message: 'If that email exists, a reset link has been sent.' };

  try {
    const user = await User.findOne({ email });
    if (!user || (user.authProvider === 'google' && !user.password)) return res.json(successMsg);

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'https://personal-finance-tracker-sovit.netlify.app';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"Finance Tracker" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Reset your password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto">
          <h2>Password Reset Request</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold;margin:16px 0">
            Reset Password
          </a>
          <p style="color:#666;font-size:14px">If you didn't request this, ignore this email.</p>
        </div>`,
    });

    res.json(successMsg);
  } catch (err) {
    console.error('Forgot password error:', err.message);
    // Clean up token
    try {
      const u = await User.findOne({ email });
      if (u) { u.passwordResetToken = undefined; u.passwordResetExpires = undefined; await u.save({ validateBeforeSave: false }); }
    } catch (_) {}
    res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }
});

// ─── Reset Password ───────────────────────────────────────────────────────────

router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !email || !password)
      return res.status(400).json({ error: 'Token, email and new password are required.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

    if (!user || user.passwordResetToken !== hashedToken || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.authProvider = 'local';
    await user.save();

    sendResponse(res, 200, user, signToken(user._id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;