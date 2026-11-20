// Homepage "Reserve your spot" email section (src/components/ReserveEmail.astro): every reserve / Kickstarter CTA
// links here; the form registers the email, then sends the visitor on to the shop.

/** Anchor of the email section; CTAs on other pages link to `/${RESERVE_ID}` */
export const RESERVE_ID = "#reserve";

/** Backend endpoint that receives early access sign-ups (POST JSON, email only) */
export const EARLY_ACCESS_ENDPOINT = "https://amis-wifi-backend-947027167514.us-central1.run.app/api/v1/earlyaccess";

/** Shop page the visitor lands on after a successful sign-up */
export const SHOP_URL = "https://n1wgyk-eh.myshopify.com/products/tokkey-deposit-reservation";

export const RESERVE_HREF = SHOP_URL;

/** Link attributes for "Reserve your spot" CTAs: open the shop in a new tab (spread onto an <a>) */
export const RESERVE_LINK_ATTRS = { href: SHOP_URL, rel: "noopener noreferrer" } as const;
