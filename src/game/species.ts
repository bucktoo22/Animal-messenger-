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
};

export const SPECIES_LIST: Species[] = Object.values(SPECIES);

export const FOODS: Record<FoodId, { name: string; emoji: string }> = {
  seeds: { name: 'Seeds', emoji: '🌻' },
  lettuce: { name: 'Lettuce', emoji: '🥬' },
  fish: { name: 'Fish', emoji: '🐟' },
  bread: { name: 'Bread', emoji: '🍞' },
  berries: { name: 'Berries', emoji: '🫐' },
};

/** Chance an egg is each rarity. Only rarities that have species in the MVP are listed. */
export const EGG_ODDS: { rarity: Rarity; chance: number }[] = [
  { rarity: 'common', chance: 0.85 },
  { rarity: 'rare', chance: 0.15 },
];

export const ANIMAL_COLOURS = ['#F4A261', '#8AB17D', '#7FB3D5', '#C39BD3', '#F7DC6F', '#B0A8A0'];
