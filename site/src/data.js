import forest from '@assets/forest.webp'
import neem from '@assets/neem-single.webp'
import sidr from '@assets/sidr.webp'
import acacia from '@assets/acacia.webp'
import wild from '@assets/wild.webp'
import wild3k from '@assets/wild3k.webp'
import acv from '@assets/acv.webp'
import story from '@assets/story.webp'
import lifestyle from '@assets/lifestyle.webp'
import ginger from '@assets/ginger.webp'
import logo from '@assets/logo.png'

export const img = { forest, neem, sidr, acacia, wild, wild3k, acv, story, lifestyle, ginger, logo }

// tint = card background in the product grid, deep = colour behind the jar in the gallery
export const products = [
  {
    slug: 'raw-forest-honey', n: 'Raw Forest Honey', cat: 'Raw Honey', img: forest, tint: '#f6dcc0', deep: '#7a3e0d', price: 400,
    desc: 'Dark, woody and deep. Gathered by honey hunters from the wild forests of India, it carries the taste of a hundred different blossoms and the shade of the trees they grow under. Ingredients: raw forest honey, nothing else.',
    tips: 'Lovely over curd, in warm (never boiling) water with lemon, or straight from the spoon. It may crystallise — stand the jar in warm water to soften it.',
    sizes: ['250 g', '500 g', '1 kg'], shelf: '24 months',
  },
  {
    slug: 'raw-acacia-honey', n: 'Raw Acacia Honey', cat: 'Raw Honey', img: acacia, tint: '#fbeab0', deep: '#c89a1a', price: 649,
    desc: 'Pale gold, delicate and floral. Acacia honey is naturally slow to crystallise, so it stays clear and runny for months. Ingredients: raw acacia honey, nothing else.',
    tips: 'The gentlest honey for tea, dressings and children’s breakfasts. Keep away from heat and direct sunlight.',
    sizes: ['500 g'], shelf: '24 months',
  },
  {
    slug: 'premium-sidr-honey', n: 'Premium Sidr Honey', cat: 'Rare Honey', img: sidr, tint: '#f9cdb1', deep: '#9b4a10', price: 650,
    desc: 'Rich, buttery and rare. Made from the blossoms of the sidr tree, which flowers only briefly each year. Thick, smooth and warmly caramel. Ingredients: raw sidr honey.',
    tips: 'Best enjoyed on its own, a spoonful at a time. Pairs beautifully with dates and aged cheese.',
    sizes: ['350 g'], shelf: '24 months',
  },
  {
    slug: 'neem-blossom-honey', n: 'Neem Blossom Honey', cat: 'Herbal Honey', img: neem, tint: '#dfe6c6', deep: '#4c5a2a', price: 729,
    desc: 'Gentle and herbal, with a faintly bitter finish. Bees gather it from neem blossoms during the short flowering season. Ingredients: raw neem blossom honey.',
    tips: 'A traditional morning ritual with warm water. Store tightly closed in a cool cupboard.',
    sizes: ['500 g', '1 kg'], shelf: '24 months',
  },
  {
    slug: 'raw-wild-honey', n: 'Raw Wild Honey', cat: 'Raw Honey', img: wild, tint: '#f7d3c8', deep: '#8a4310', price: 400,
    desc: 'Untamed and seasonal — every harvest tastes a little different. Unheated and unfiltered, straight from the comb to the jar. Ingredients: raw wild honey.',
    tips: 'Drizzle over fruit, porridge or warm rotis. Crystallisation is natural and a sign it has not been heated.',
    sizes: ['500 g', '3 kg'], shelf: '24 months',
  },
  {
    slug: 'wild-honey-family-pack', n: 'Wild Honey Family Pack', cat: 'Raw Honey', img: wild3k, tint: '#eadfcf', deep: '#5a3a1a', price: 2050,
    desc: 'Our raw wild honey in a 3 kg jar, for households that go through honey quickly — and for small bakeries and kitchens. Ingredients: raw wild honey.',
    tips: 'Decant into a smaller jar for the table and keep the large one sealed in a cool place.',
    sizes: ['3 kg'], shelf: '24 months',
  },
  {
    slug: 'apple-cider-vinegar', n: 'Apple Cider Vinegar', cat: 'Pantry', img: acv, tint: '#f6e2cc', deep: '#2f4a2c', price: 395,
    desc: 'Raw, unfiltered and with the mother. Made from crushed apples and left to ferment slowly. Ingredients: apple cider vinegar.',
    tips: 'Mix a spoonful with a spoonful of honey in warm water. Shake gently before use.',
    sizes: ['500 ml'], shelf: '36 months',
  },
]

export const gallery = [img.lifestyle, img.story, img.ginger]
