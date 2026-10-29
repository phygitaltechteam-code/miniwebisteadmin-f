/**
 * Where public cards live (the /<display link> page).
 * Set VITE_CARD_BASE_URL in .env, e.g. http://localhost:5173 while testing, https://digiwebcard.in when live.
 * When it is not set, the address this app is opened on is used.
 */
export const CARD_BASE_URL = String(import.meta.env.VITE_CARD_BASE_URL || window.location.origin).replace(/\/+$/, '');

/** Host shown before the link field, e.g. "localhost:5173/" or "digiwebcard.in/" */
export const CARD_HOST_LABEL = `${CARD_BASE_URL.replace(/^https?:\/\//, '')}/`;

/** Full public card link for a display link (or admin id) */
export const cardUrlFor = (slug?: string) => `${CARD_BASE_URL}/${slug || ''}`;

/** A card link from the backend rebuilt on our base (keeps only its last path part) */
export const rebaseCardUrl = (link?: string) => {
  const slug = String(link || '').replace(/\/+$/, '').split('/').pop();
  return slug ? cardUrlFor(slug) : '';
};
