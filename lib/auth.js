import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = 'crypi_token';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

// Creates a signed JWT token containing the user's id and username.
// The token expires in 7 days — after that the user must log in again.
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
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
export function clearCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
}

// Reads the JWT cookie from an incoming API request and returns the decoded user,
// or null if the cookie is missing or the token is invalid.
// Called at the top of every protected API route to check if the user is logged in.
export function getUserFromRequest(req) {
  const cookieHeader = req.headers.cookie || '';
  // Extract the token value from the cookie string using regex
  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(match[1]);
}
