import type { FoodId, Rarity, Species, SpeciesId } from './types';

export const SPECIES: Record<SpeciesId, Species> = {
  pigeon: {
    id: 'pigeon',
    name: 'Pigeon',
    emoji: '🐦',
    rarity: 'common',
    deliveryMinutes: 10,
    baseMishapChance: 0.03,
    lostShare: 0.3,
    favouriteFood: 'seeds',
    personality: 'Dependable starter. Quick and rarely fusses.',
  },
  tortoise: {
    id: 'tortoise',
    name: 'Tortoise',
    emoji: '🐢',
    rarity: 'common',
    deliveryMinutes: 24 * 60,
    baseMishapChance: 0.01,
    lostShare: 0.5,
    favouriteFood: 'lettuce',
    personality: 'Takes about a day, but never loses anything.',
  },
  cat: {
    id: 'cat',
    name: 'Cat',
    emoji: '🐱',
    rarity: 'common',
    deliveryMinutes: 120,
    baseMishapChance: 0.06,
    lostShare: 0.5,
    favouriteFood: 'fish',
    personality: 'Gets there eventually. Sometimes naps on the way.',
  },
  dog: {
    id: 'dog',
    name: 'Dog',
    emoji: '🐶',
    rarity: 'common',
    deliveryMinutes: 30,
    baseMishapChance: 0.03,
    lostShare: 0.3,
    favouriteFood: 'meat',
    personality: 'Eager and loyal. Runs straight there and loves a game of fetch.',
  },
  duckling: {
    id: 'duckling',
    name: 'Duckling',
    emoji: '🐥',
    rarity: 'common',
    deliveryMinutes: 120,
    baseMishapChance: 0.15,
    lostShare: 0.4,
    favouriteFood: 'bread',
    personality: 'Clumsy. Easily distracted by puddles.',
  },
  axolotl: {
    id: 'axolotl',
    name: 'Axolotl',
    // No axolotl emoji exists yet, so a lizard stands in until there's real art.
    emoji: '🦎',
    rarity: 'uncommon',
    deliveryMinutes: 6 * 60,
    baseMishapChance: 0.02,
    lostShare: 0.5,
    favouriteFood: 'worms',
    personality: 'Always smiling. Slow on land, so it takes about 6 hours, but it is very careful.',
  },
  armadillo: {
    id: 'armadillo',
    name: 'Armadillo',
    // No armadillo emoji exists yet, so a hedgehog stands in until there's real art.
    emoji: '🦔',
    rarity: 'uncommon',
    deliveryMinutes: 4 * 60,
    baseMishapChance: 0.12,
    lostShare: 0.25,
    favouriteFood: 'ants',
    personality: 'Rolls into a ball when startled, and the message often rolls away.',
  },
  fox: {
    id: 'fox',
    name: 'Fox',
    emoji: '🦊',
    rarity: 'rare',
    deliveryMinutes: 15,
    baseMishapChance: 0.08,
    lostShare: 0.8,
    favouriteFood: 'berries',
    personality: 'Fast, takes shortcuts, and sometimes gets lost.',
  },
  snowLeopard: {
    id: 'snowLeopard',
    name: 'Snow leopard',
    emoji: '🐆',
    rarity: 'rare',
    deliveryMinutes: 20,
    baseMishapChance: 0.05,
    lostShare: 0.7,
    favouriteFood: 'meat',
    personality: 'Fast and graceful, but likes to wander off into the mountains.',
  },
  giraffe: {
    id: 'giraffe',
    name: 'Giraffe',
    emoji: '🦒',
    rarity: 'rare',
    deliveryMinutes: 45,
    baseMishapChance: 0.04,
    lostShare: 0.2,
    favouriteFood: 'leaves',
    personality: 'Sees over everything, so it rarely gets lost. Stops to snack on treetops.',
  },
};

export const SPECIES_LIST: Species[] = Object.values(SPECIES);

export const FOODS: Record<FoodId, { name: string; emoji: string }> = {
  seeds: { name: 'Seeds', emoji: '🌻' },
  lettuce: { name: 'Lettuce', emoji: '🥬' },
  fish: { name: 'Fish', emoji: '🐟' },
  bread: { name: 'Bread', emoji: '🍞' },
  berries: { name: 'Berries', emoji: '🫐' },
  meat: { name: 'Meat', emoji: '🍖' },
  worms: { name: 'Worms', emoji: '🪱' },
  ants: { name: 'Ants', emoji: '🐜' },
  leaves: { name: 'Leaves', emoji: '🌿' },
};

/** Chance an egg is each rarity. Only rarities that have species are listed. */
export const EGG_ODDS: { rarity: Rarity; chance: number }[] = [
  { rarity: 'common', chance: 0.65 },
  { rarity: 'uncommon', chance: 0.25 },
  { rarity: 'rare', chance: 0.1 },
];

export const ANIMAL_COLOURS = ['#F4A261', '#8AB17D', '#7FB3D5', '#C39BD3', '#F7DC6F', '#B0A8A0', '#F5B7C5'];
