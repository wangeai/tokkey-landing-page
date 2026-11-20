// Homepage deposit sections (src/components/DepositHero.astro, src/components/DepositOffer.astro), ported from the
// Shopify store's home page (Figma 869:20 and 871:1952).

/** One price tier card in the deposit offer */
export interface PriceTier {
  /** Small heading above the price */
  label: string;
  price: string;
  /** Struck-through retail price under the price */
  msrp: string;
  /** Savings badge next to the price; only the highlighted tier has one */
  badge?: string;
  /** Green-bordered card that the deposit locks in */
  highlight?: boolean;
}

export const DEPOSIT_TIERS: PriceTier[] = [
  { label: "VIP ONLY", price: "$129", msrp: "MSRP $189", badge: "Save $60", highlight: true },
  { label: "Super Early Bird", price: "$149", msrp: "MSRP $189" },
];

/** Shop product page the "Deposit Now" and "Pay $5 Deposit" buttons send visitors to */
export const DEPOSIT_URL = "https://shop.tokkey.ai/products/tokkey-deposit-reservation";
