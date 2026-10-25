// Pure game rules. No React or device APIs here, so these can move to the server unchanged.
import { EGG_ODDS, SPECIES, SPECIES_LIST } from './species';
import { randomTraits, traitBonus, traitFactor, validTraits } from './traits';
import type { Animal, Egg, FoodId, Message, Meters, Rarity, TraitId } from './types';

export type Rng = () => number;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;

/** A lost animal that nobody searches for finds its own way home after this long. */
export const LOST_AUTO_RETURN = 24 * HOUR;
/** Every this many clean deliveries earns an egg. */
export const DELIVERIES_PER_EGG = 3;
export const SEND_ENERGY_COST = 15;
export const PLAY_ENERGY_COST = 10;

const clamp = (n: number, lo = 0, hi = 100) => Math.min(hi, Math.max(lo, n));

/** Bring an animal's meters up to `now`: hunger and happiness drop, energy recovers at home. */
export function updateMeters(animal: Animal, now: number): Animal {
  const hours = Math.max(0, now - animal.metersUpdatedAt) / HOUR;
  if (hours === 0) return animal;
  const m = animal.meters;
  const meters: Meters = {
    hunger: clamp(m.hunger - 4 * traitFactor(animal, 'hungerRate') * hours),
    happiness: clamp(m.happiness - 3 * traitFactor(animal, 'happinessRate') * hours),
    energy: clamp(animal.busyWith ? m.energy : m.energy + 10 * traitFactor(animal, 'energyRate') * hours),
  };
  return { ...animal, meters, metersUpdatedAt: now };
}

export function feed(animal: Animal, food: FoodId, now: number): Animal {
  const a = updateMeters(animal, now);
  const favourite = SPECIES[a.speciesId].favouriteFood === food;
  return {
    ...a,
    meters: { ...a.meters, hunger: clamp(a.meters.hunger + (favourite ? 40 : 25) + traitBonus(a, 'foodBonus')) },
    bond: a.bond + 1,
  };
}

export function canPlay(animal: Animal): boolean {
  return !animal.busyWith && animal.meters.energy >= PLAY_ENERGY_COST;
}

export function play(animal: Animal, now: number): Animal {
  const a = updateMeters(animal, now);
  if (!canPlay(a)) return a;
  return {
    ...a,
    meters: {
      ...a.meters,
      happiness: clamp(a.meters.happiness + 30 + traitBonus(a, 'playBonus')),
      energy: clamp(a.meters.energy - PLAY_ENERGY_COST),
    },
    bond: a.bond + 2,
  };
}

function moodAverage(m: Meters): number {
  return (m.hunger + m.energy + m.happiness) / 3;
}

/** One-way trip time in ms. Bond makes animals up to 25% faster; a grumpy animal is 30% slower; traits adjust it. */
export function deliveryDuration(animal: Animal): number {
  const base = SPECIES[animal.speciesId].deliveryMinutes * MINUTE;
  const bondBonus = 1 - Math.min(animal.bond, 50) / 200;
  const moodPenalty = moodAverage(animal.meters) < 40 ? 1.3 : 1;
  return Math.round(base * bondBonus * moodPenalty * traitFactor(animal, 'speed'));
}

/** Chance (0 to 0.9) the trip goes wrong. Hungry or tired animals are clumsier; bond helps. */
export function mishapChance(animal: Animal): number {
  const s = SPECIES[animal.speciesId];
  let factor = 1;
  if (animal.meters.hunger < 30) factor += 0.5;
  if (animal.meters.energy < 30) factor += 0.5;
  factor *= Math.max(0.5, 1 - animal.bond / 100);
  factor *= traitFactor(animal, 'mishap');
  return Math.min(0.9, s.baseMishapChance * factor);
}

export function canSend(animal: Animal): boolean {
  return !animal.busyWith && animal.meters.energy >= SEND_ENERGY_COST;
}

function rollMishap(animal: Animal, start: number, duration: number, rng: Rng, chanceScale = 1) {
  if (rng() >= mishapChance(animal) * chanceScale) return null;
  const lostShare = Math.min(1, SPECIES[animal.speciesId].lostShare * traitFactor(animal, 'lost'));
  const kind: 'lost' | 'dropped' = rng() < lostShare ? 'lost' : 'dropped';
  // Mishaps happen somewhere between 30% and 80% of the way.
  return { kind, at: start + Math.round(duration * (0.3 + 0.5 * rng())) };
}

export function sendMessage(params: {
  id: string;
  from: string;
  to: string;
  text: string;
  animal: Animal;
  now: number;
  rng: Rng;
}): { message: Message; animal: Animal } {
  const { id, from, to, text, now, rng } = params;
  const animal = updateMeters(params.animal, now);
  if (!canSend(animal)) throw new Error(`${animal.name} can't carry a message right now`);
  const duration = deliveryDuration(animal);
  const message: Message = {
    id,
    from,
    to,
    text,
    animalId: animal.id,
    sentAt: now,
    arriveAt: now + duration,
    mishap: rollMishap(animal, now, duration, rng),
    status: 'travelling',
    homeAt: null,
    incoming: false,
    read: true,
  };
  return {
    message,
    animal: {
      ...animal,
      busyWith: id,
      meters: { ...animal.meters, energy: clamp(animal.meters.energy - SEND_ENERGY_COST) },
    },
  };
}

/** Move a message's journey forward to `now`. Returns the same object when nothing changed. */
export function advanceMessage(message: Message, now: number): Message {
  if (message.incoming) {
    return message.status === 'travelling' && now >= message.arriveAt
      ? { ...message, status: 'delivered' }
      : message;
  }
  switch (message.status) {
    case 'travelling': {
      if (message.mishap && now >= message.mishap.at) {
        const { kind, at } = message.mishap;
        // A clumsy animal that drops its message wanders home on its own; a lost one waits to be found.
        const homeAt = kind === 'dropped' ? at + (at - message.sentAt) : null;
        return advanceMessage({ ...message, status: kind, homeAt }, now);
      }
      if (!message.mishap && now >= message.arriveAt) {
        const returnTrip = Math.round((message.arriveAt - message.sentAt) / 2);
        return { ...message, status: 'delivered', homeAt: message.arriveAt + returnTrip };
      }
      return message;
    }
    case 'lost': {
      const at = message.mishap!.at;
      if (now >= at + LOST_AUTO_RETURN) {
        return { ...message, status: 'returned', homeAt: at + LOST_AUTO_RETURN };
      }
      return message;
    }
    default:
      return message;
  }
}

/** How far along the path the animal is, 0 to 1. Stops where a mishap happened. */
export function journeyProgress(message: Message, now: number): number {
  const total = message.arriveAt - message.sentAt;
  if (total <= 0) return 1;
  if (message.status === 'delivered') return 1;
  const point = message.mishap && message.status !== 'travelling' ? message.mishap.at : now;
  return Math.min(1, Math.max(0, (point - message.sentAt) / total));
}

/**
 * A lost animal has been found. It carries on from where it got lost, or starts over
 * if it's given a new recipient. The new trip rolls for mishaps at half the usual chance.
 */
export function redirectFound(params: {
  message: Message;
  animal: Animal;
  now: number;
  rng: Rng;
  newText?: string;
  newTo?: string;
}): Message {
  const { message, animal, now, rng } = params;
  if (message.status !== 'lost' || !message.mishap) throw new Error('Only lost animals can be redirected');
  const sameRoute = !params.newTo || params.newTo === message.to;
  const remaining = sameRoute ? message.arriveAt - message.mishap.at : deliveryDuration(animal);
  // On the same route, backdate the start so the journey picks up where it stopped.
  const covered = sameRoute ? message.mishap.at - message.sentAt : 0;
  return {
    ...message,
    text: params.newText ?? message.text,
    to: params.newTo ?? message.to,
    sentAt: now - covered,
    arriveAt: now + remaining,
    mishap: rollMishap(animal, now, remaining, rng, 0.5),
    status: 'travelling',
    homeAt: null,
  };
}

/** Send a dropped or returned message again with any free animal. */
export function resendMessage(params: {
  message: Message;
  animal: Animal;
  now: number;
  rng: Rng;
  newText?: string;
}): { message: Message; animal: Animal } {
  const { message } = params;
  if (message.status !== 'dropped' && message.status !== 'returned') {
    throw new Error('Only dropped or returned messages can be sent again');
  }
  return sendMessage({
    id: message.id,
    from: message.from,
    to: message.to,
    text: params.newText ?? message.text,
    animal: params.animal,
    now: params.now,
    rng: params.rng,
  });
}

export function rollEggRarity(rng: Rng): Rarity {
  let r = rng();
  for (const { rarity, chance } of EGG_ODDS) {
    if (r < chance) return rarity;
    r -= chance;
  }
  return EGG_ODDS[0].rarity;
}

export function hatchEgg(params: {
  egg: Egg;
  id: string;
  name: string;
  colour: string;
  /** Chosen traits, or random ones when left out. */
  traits?: TraitId[];
  now: number;
  rng: Rng;
}): Animal {
  const { egg, rng } = params;
  const traits = params.traits ?? randomTraits(rng);
  if (!validTraits(traits)) throw new Error('Pick up to two traits that go together');
  const options = SPECIES_LIST.filter((s) => s.rarity === egg.rarity);
  const pool = options.length ? options : SPECIES_LIST.filter((s) => s.rarity === 'common');
  const species = pool[Math.floor(rng() * pool.length)];
  return newAnimal({ id: params.id, speciesId: species.id, name: params.name, colour: params.colour, traits, now: params.now });
}

export function newAnimal(params: {
  id: string;
  speciesId: Animal['speciesId'];
  name: string;
  colour: string;
  traits?: TraitId[];
  now: number;
}): Animal {
  const { now, traits = [], ...rest } = params;
  return {
    ...rest,
    traits,
    meters: { hunger: 80, energy: 100, happiness: 80 },
    metersUpdatedAt: now,
    bond: 0,
    busyWith: null,
  };
}
