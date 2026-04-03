/**
 * LINE Login OAuth utility.
 *
 * Redirects to LINE Login, then handles the callback to exchange
 * the authorization code for a customer record.
 */

const CHANNEL_ID = import.meta.env.VITE_LINE_LOGIN_CHANNEL_ID;
const API_BASE = import.meta.env.VITE_API_BASE;

/**
 * Build the LINE Login authorization URL.
 * After consent, LINE redirects back to `redirectUri` with `?code=xxx&state=xxx`.
 */
/**
 * @param {string} state — passed back by LINE after auth (e.g. orderId)
 */
export function getLineLoginUrl(state = "") {
  const redirectUri = encodeURIComponent(getRedirectUri());
  return (
    `https://access.line.me/oauth2/v2.1/authorize` +
    `?response_type=code` +
    `&client_id=${CHANNEL_ID}` +
    `&redirect_uri=${redirectUri}` +
    `&state=${encodeURIComponent(state)}` +
    `&scope=profile%20openid` +
    `&bot_prompt=aggressive`
  );
}

/**
 * The redirect URI LINE will send the user back to.
 * Must match what's registered in LINE Developers Console.
 * LINE doesn't support hash fragments, so we use the base URL.
 * The code will appear as ?code=xxx on the root page.
 */
export function getRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}

/**
 * Exchange LINE authorization code for customer info.
 * Returns { customerId, lineUserId, displayName, pictureUrl }
 */
export async function exchangeLineCode(code) {
  const res = await fetch(`${API_BASE}/api/v1/auth/line`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      redirectUri: getRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error("LINE login failed");
  return res.json();
}
