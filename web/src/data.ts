/* The single-file build embeds the photos as data URIs in window.__ASSETS */
declare global { interface Window { __ASSETS?: Record<string, string> } }
export const asset = (file: string) => window.__ASSETS?.[file] ?? import.meta.env.BASE_URL + file;

export type Product = {
  n: string;
  m: string;
  p: number | null;
  was?: number;
  c: string;
  h: string;
  cat: 'raw' | 'herbal' | 'pantry';
  lbl: string;
  wide?: boolean;
  big?: boolean;
  dark?: boolean;
  sold?: boolean;
  bottle?: boolean;
  img?: string;
  life?: boolean;
};

export const products: Product[] = [
  {n: 'Raw Forest Honey', m: '500 g · Wild-harvested', p: 400, c: '#d9a441', h: '#7a3e0d', cat: 'raw', wide: true, lbl: '#fdf3e4', img: 'forest.webp'},
  {n: 'Neem Blossom Honey', m: '1 kg · Herbal', p: 729, was: 800, c: '#b9c98f', h: '#a9620f', cat: 'herbal', lbl: '#fdf3e4', img: 'neem.webp'},
  {n: 'Premium Raw Sidr Honey', m: '350 g · Rare', p: 650, c: '#f08a4b', h: '#9b4a10', cat: 'raw', lbl: '#fdf3e4', img: 'sidr.webp'},
  {n: 'Raw Acacia Honey', m: '500 g · Light & floral', p: 649, was: 675, c: '#f6dd8a', h: '#e8b62a', cat: 'raw', sold: true, lbl: '#2b1a0e', img: 'acacia.webp', life: true},
  {n: 'Raw Wild Honey', m: '500 g · Unheated', p: 400, c: '#e9a48f', h: '#8a4310', cat: 'raw', sold: true, lbl: '#fdf3e4', img: 'wild.webp'},
  {n: 'Black Seed Oil', m: '200 ml · Cold-pressed, organic', p: null, c: '#2f4a2c', h: '#1a1208', cat: 'pantry', bottle: true, dark: true, lbl: '#e8a317'},
  {n: 'Raw Wild Honey — Value Pack', m: '3 kg · For the whole family', p: 2050, c: '#c9b79c', h: '#7a3e0d', cat: 'raw', sold: true, wide: true, big: true, lbl: '#fdf3e4', img: 'wild3k.webp'},
  {n: 'Apple Cider Vinegar', m: '500 ml · With the mother', p: 395, c: '#f3c9a6', h: '#d48a2c', cat: 'pantry', bottle: true, sold: true, lbl: '#2b1a0e', img: 'acv.webp'},
];

export const filters = [
  {f: 'all', label: 'All'},
  {f: 'raw', label: 'Raw honey'},
  {f: 'herbal', label: 'Herbal honey'},
  {f: 'pantry', label: 'Oils & vinegar'},
] as const;

export const slides = [
  {img: 'forest.webp', word: 'forest', bg: '#fdf3e4', col: '#c4720d', label: 'Forest honey'},
  {img: 'acacia.webp', word: 'acacia', bg: '#fbf0cf', col: '#b8961a', label: 'Acacia honey'},
  {img: 'sidr.webp', word: 'sidr tree', bg: '#fbe3cf', col: '#c94a2a', label: 'Sidr honey'},
];

export const marquee = ['Raw Forest Honey', 'Neem Blossom', 'Premium Sidr', 'Raw Acacia', 'Wild Honey', 'Cold-pressed Black Seed Oil'];

export const steps = [
  {h: 'Gathered', p: 'Sourced from forests and floral regions across India, season by season, from beekeepers and honey hunters we know.', icon: 'M28 6l20 11.5v23L28 52 8 40.5v-23z|M28 18c-5 6-8 10-8 14a8 8 0 0016 0c0-4-3-8-8-14z'},
  {h: 'Tested', p: "Every batch is checked against our quality standards for purity and safety before it's approved.", icon: 'M22 6h12M24 6v16L10 46a3 3 0 002.6 4.5h30.8A3 3 0 0046 46L32 22V6|M16 36h24'},
  {h: 'Never heated', p: "Our raw honeys are left unheated and unprocessed, so they keep their natural character — and may crystallise. That's a good sign.", icon: 'M28 8a20 20 0 1 0 0.01 0z|M28 16v24M20 22c4 4 12 4 16 0M20 34c4-4 12-4 16 0|M12 12l32 32'},
  {h: 'Jarred', p: 'Strained gently and poured into glass in Bangalore, then sent straight to your door.', icon: 'M14 22a6 6 0 016-6h16a6 6 0 016 6v22a6 6 0 01-6 6H20a6 6 0 01-6-6z|M19 8h18a2 2 0 012 2v4a2 2 0 01-2 2H19a2 2 0 01-2-2v-4a2 2 0 012-2z|M14 30h28'},
];

export const trades = [
  {k: 'Supply', h: 'Bulk Honey', p: 'Consistent, tested raw honey by the drum for food, wellness and cosmetics production.'},
  {k: 'Your brand', h: 'Private Label', p: 'Our honey in your jar. We help with variety selection, packing and labelling.'},
  {k: 'Partners', h: 'Distribution', p: 'Stock Safa in your store or region. Retail and distribution partnerships welcome.'},
];

export const featured = [
  {img: 'lifestyle.webp', alt: 'A family laughing in the kitchen with a jar of Safa Raw Acacia Honey', date: 'Apr 2019', cat: 'Everyday', h: '5 things that start happening when you take honey every day', pos: '50% 100%'},
  {img: 'ginger.webp', alt: 'Honey dripping from a dipper into a glass bowl beside fresh ginger root', date: 'Mar 2018', cat: 'Rituals', h: 'Ginger & honey: a warming tradition'},
];

export const posts = [
  {date: 'Oct 2018', h: '5 ways to supercharge your breakfast with honey', cat: 'Recipes'},
  {date: 'Sep 2018', h: '3 DIY natural honey hair-care masks', cat: 'Beauty'},
];
