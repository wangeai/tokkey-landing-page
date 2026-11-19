// Homepage "Reserve your spot" email section (src/components/ReserveEmail.astro): every reserve / Kickstarter CTA
// links here; the form registers the email, then sends the visitor on to the shop.

/** Anchor of the email section; CTAs on other pages link to `/${RESERVE_ID}` */
export const RESERVE_ID = "#reserve";
export const RESERVE_HREF = `/${RESERVE_ID}`;

/** Backend endpoint that receives early access sign-ups (POST JSON, email only) */
export const EARLY_ACCESS_ENDPOINT = "https://amis-wifi-backend-947027167514.us-central1.run.app/api/v1/earlyaccess";

/** Shop page the visitor lands on after a successful sign-up */
export const SHOP_URL = "https://n1wgyk-eh.myshopify.com/products/tokkey-deposit-reservation";
