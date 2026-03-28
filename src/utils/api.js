import axios from "axios";
import i18n from "../i18n";

const API_BASE = import.meta.env.VITE_API_BASE;

/** Axios instance pre-configured with base URL */
export const api = axios.create({
  baseURL: API_BASE,
});

// ── Auth token management ───────────────────────────────────────────────────

const TOKEN_KEY = "banri-token";

// Restore token from localStorage on module load
const savedToken = localStorage.getItem(TOKEN_KEY);
if (savedToken) {
  api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
}

/** Store (or clear) the JWT and update the axios default header. */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    localStorage.removeItem(TOKEN_KEY);
    delete api.defaults.headers.common["Authorization"];
  }
}

// ── Cart token management ───────────────────────────────────────────────────

const CART_TOKEN_KEY = "banri-cart-token";

/** Get (or create) a stable cart session token. */
export function getCartToken() {
  let token = localStorage.getItem(CART_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(CART_TOKEN_KEY, token);
  }
  return token;
}

/** Headers object to include on every cart / order request. */
export function cartHeaders() {
  return { "X-Cart-Token": getCartToken() };
}

/** Discard the cart token (e.g. after placing an order). */
export function clearCartToken() {
  localStorage.removeItem(CART_TOKEN_KEY);
}

// ── Delivery method sync ────────────────────────────────────────────────────

const DELIVERY_METHOD_KEY = "banri-delivery-method";

/** Save selected delivery method to localStorage. */
export function saveDeliveryMethod(methodId) {
  if (methodId) {
    localStorage.setItem(DELIVERY_METHOD_KEY, methodId);
  } else {
    localStorage.removeItem(DELIVERY_METHOD_KEY);
  }
}

/** Get saved delivery method from localStorage. */
export function getSavedDeliveryMethod() {
  return localStorage.getItem(DELIVERY_METHOD_KEY) || "";
}

// ── Delivery address sync ───────────────────────────────────────────────────

const DELIVERY_CITY_KEY = "banri-delivery-city";
const DELIVERY_DISTRICT_KEY = "banri-delivery-district";

/** Save selected city/district to localStorage. */
export function saveDeliveryAddress(city, district) {
  if (city) {
    localStorage.setItem(DELIVERY_CITY_KEY, city);
  } else {
    localStorage.removeItem(DELIVERY_CITY_KEY);
  }
  if (district) {
    localStorage.setItem(DELIVERY_DISTRICT_KEY, district);
  } else {
    localStorage.removeItem(DELIVERY_DISTRICT_KEY);
  }
}

/** Get saved city from localStorage. */
export function getSavedCity() {
  return localStorage.getItem(DELIVERY_CITY_KEY) || "";
}

/** Get saved district from localStorage. */
export function getSavedDistrict() {
  return localStorage.getItem(DELIVERY_DISTRICT_KEY) || "";
}

// ── i18n helpers ────────────────────────────────────────────────────────────

/**
 * Extract the localized string from a JSON field like { zh, en }.
 * Maps i18n language (zh-TW → zh, en → en).
 */
export function localizedName(field) {
  if (!field) return "";
  const lang = i18n.language;
  if (lang === "zh-TW" || lang.startsWith("zh")) {
    return field.zh || field.en || "";
  }
  return field.en || field.zh || "";
}

/**
 * Append ImageKit transformation parameters to a URL.
 * Example: ikTransform(url, "w-400,h-300,cm-extract") → url + "?tr=w-400,h-300,cm-extract"
 */
export function ikTransform(url, transforms) {
  if (!url || !transforms) return url;
  const sep = url.includes("?") ? "," : "?tr=";
  return `${url}${sep}${transforms}`;
}

/**
 * Get the primary image URL from a product's images array.
 * Falls back to the first image, then empty string.
 */
export function primaryImageUrl(images) {
  if (!Array.isArray(images) || images.length === 0) return "";
  const primary = images.find((img) => img.isPrimary);
  return (primary || images[0]).url;
}

/**
 * Get price range from variants array.
 * Returns { min, max } as numbers (BigInt comes as string from API).
 */
export function priceRange(variants) {
  if (!Array.isArray(variants) || variants.length === 0) {
    return { min: 0, max: 0 };
  }
  const prices = variants.map((v) => Number(v.price));
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
