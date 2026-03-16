import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'crypi_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Creates a signed JWT token containing the user's id, username, and a unique session id (jti).
// Returns { token, jti } — the caller must store the jti in the sessions collection.
export function signToken(payload) {
  const jti = crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn: '7d' });
  return { token, jti };
}

// Verifies that a token is genuine and not expired.
// Returns the decoded user data inside the token, or null if invalid.
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    // jwt.verify throws if the token is fake, tampered with, or expired
    return null;
  }
}

// Builds the Set-Cookie string to send the token to the browser.
// HttpOnly = JavaScript cannot read this cookie (protects against XSS attacks)
// SameSite=Strict = the browser will not send this cookie on cross-site requests (protects against CSRF attacks)
// Secure = only sent over HTTPS (enabled in production only, so localhost still works)
export function buildCookieHeader(token) {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Strict${secureFlag}`;
}

// Builds a cookie header that immediately expires — used for logout.
// Setting Max-Age=0 tells the browser to delete the cookie right away.
// The Secure flag must match what was set when the cookie was created,
// otherwise some browsers may not clear it properly in production.
export function clearCookieHeader() {
  const isProduction = process.env.NODE_ENV === 'production';
  const secureFlag = isProduction ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${secureFlag}`;
}

// Reads and decodes the JWT cookie from an incoming request (no DB check).
// Used internally and for logout (to extract the jti before deleting the session).
export function getUserFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(match[1]);
}

// Full auth check: decodes the JWT AND verifies the session is still active in the DB.
// Returns the decoded user if valid, or null if the token is invalid or the session was revoked.
// Use this in all protected API routes instead of getUserFromRequest.
export async function getAuthenticatedUser(req, db) {
  const decoded = getUserFromRequest(req);
  if (!decoded?.jti) return null;
  const session = await db.collection('sessions').findOne({ jti: decoded.jti });
  if (!session) return null;
  return decoded;
}
