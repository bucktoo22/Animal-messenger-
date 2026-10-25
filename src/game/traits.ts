import type { Rng } from './rules';
import type { Animal, TraitId } from './types';

export interface Trait {
  id: TraitId;
  name: string;
  emoji: string;
  description: string;
  /** Multiplies trip time. */
  speed?: number;
  /** Multiplies the chance of a mishap. */
  mishap?: number;
  /** Multiplies the share of mishaps that are "got lost". */
  lost?: number;
  /** Multiply how fast each meter drops (or, for energy, recovers). */
  hungerRate?: number;
  happinessRate?: number;
  energyRate?: number;
  /** Extra points from feeding or playing. */
  foodBonus?: number;
  playBonus?: number;
}

export const TRAITS: Record<TraitId, Trait> = {
  speedy: { id: 'speedy', name: 'Speedy', emoji: '⚡', description: 'Delivers 20% faster.', speed: 0.8 },
  sleepy: {
    id: 'sleepy',
    name: 'Sleepy',
    emoji: '😴',
    description: 'Naps on the way (25% slower), but gets its energy back twice as fast.',
    speed: 1.25,
    energyRate: 2,
  },
  careful: { id: 'careful', name: 'Careful', emoji: '🧐', description: 'Much less likely to have a mishap.', mishap: 0.6 },
  clumsy: { id: 'clumsy', name: 'Clumsy', emoji: '🙃', description: 'Trips over everything, so more mishaps.', mishap: 1.5 },
  brave: { id: 'brave', name: 'Brave', emoji: '🦁', description: 'Hardly ever gets lost.', lost: 0.5 },
  curious: { id: 'curious', name: 'Curious', emoji: '🔍', description: 'Wanders off to explore, so gets lost more often.', lost: 1.5 },
  foodie: {
    id: 'foodie',
    name: 'Foodie',
    emoji: '🍩',
    description: 'Gets hungry faster, but every meal fills it up more.',
    hungerRate: 1.5,
    foodBonus: 10,
  },
  playful: {
    id: 'playful',
    name: 'Playful',
    emoji: '🎈',
    description: 'Loves playing (bigger happiness boost), but gets bored faster.',
    happinessRate: 1.5,
    playBonus: 15,
  },
  cheerful: { id: 'cheerful', name: 'Cheerful', emoji: '😊', description: 'Stays happy for longer.', happinessRate: 0.5 },
};

export const TRAIT_LIST: Trait[] = Object.values(TRAITS);
export const MAX_TRAITS = 2;

/** Pairs that can't go together on one animal. */
const OPPOSITES: [TraitId, TraitId][] = [
  ['speedy', 'sleepy'],
  ['careful', 'clumsy'],
  ['brave', 'curious'],
];

export function clashes(a: TraitId, b: TraitId): boolean {
  return OPPOSITES.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
}

export function validTraits(traits: TraitId[]): boolean {
  if (traits.length > MAX_TRAITS || new Set(traits).size !== traits.length) return false;
  return traits.every((a, i) => traits.slice(i + 1).every((b) => !clashes(a, b)));
}

export function randomTraits(rng: Rng): TraitId[] {
  const picked: TraitId[] = [];
  while (picked.length < MAX_TRAITS) {
    const options = TRAIT_LIST.filter((t) => !picked.includes(t.id) && picked.every((p) => !clashes(p, t.id)));
    picked.push(options[Math.floor(rng() * options.length)].id);
  }
  return picked;
}

type Factor = 'speed' | 'mishap' | 'lost' | 'hungerRate' | 'happinessRate' | 'energyRate';
type Bonus = 'foodBonus' | 'playBonus';

/** The combined multiplier of an animal's traits (1 when none apply). */
export function traitFactor(animal: Animal, key: Factor): number {
  // Animals saved before traits existed have none.
  return (animal.traits ?? []).reduce((f, t) => f * (TRAITS[t][key] ?? 1), 1);
}

export function traitBonus(animal: Animal, key: Bonus): number {
  return (animal.traits ?? []).reduce((sum, t) => sum + (TRAITS[t][key] ?? 0), 0);
}
