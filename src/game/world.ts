// The whole game state and every way it can change, as a pure reducer.
import {
  DELIVERIES_PER_EGG,
  MINUTE,
  advanceMessage,
  feed,
  hatchEgg,
  newAnimal,
  play,
  walk,
  redirectFound,
  resendMessage,
  rollEggRarity,
  sendMessage,
  updateMeters,
  type Rng,
} from './rules';
import { SPECIES_LIST } from './species';
import { validTraits } from './traits';
import type { Animal, Egg, FoodId, Friend, Message, TraitId } from './types';

export const PLAYER_ID = 'me';

export interface World {
  version: 1;
  animals: Animal[];
  messages: Message[];
  eggs: Egg[];
  friends: Friend[];
  cleanDeliveries: number;
  /** Extra game time added by "skip ahead", so slow animals can be tested quickly. */
  clockOffset: number;
}

export type Action =
  | { type: 'tick' }
  | { type: 'feed'; animalId: string; food: FoodId }
  | { type: 'play'; animalId: string }
  | { type: 'walk'; animalId: string; treats: number }
  | { type: 'send'; animalId: string; to: string; text: string }
  | { type: 'redirect'; messageId: string; newText?: string; newTo?: string }
  | { type: 'resend'; messageId: string; animalId: string; newText?: string }
  | { type: 'hatch'; eggId: string; name: string; colour: string; traits?: TraitId[] }
  | { type: 'customise'; animalId: string; name?: string; colour?: string; traits?: TraitId[] }
  | { type: 'read'; messageId: string }
  | { type: 'skip'; ms: number };

/** Things the reducer needs from outside: the time, randomness and fresh ids. */
export interface Env {
  now: number;
  rng: Rng;
  newId: () => string;
}

export const DEMO_FRIENDS: Friend[] = [
  { id: 'hoot', name: 'Professor Hoot', emoji: '🦉' },
  { id: 'maya', name: 'Maya', emoji: '🌷' },
  { id: 'sam', name: 'Sam', emoji: '⚽' },
];

const DEMO_REPLIES = [
  'Your animal arrived! It looked very proud of itself.',
  'Thanks for the message! I gave your courier a snack.',
  'Ha, that made my day. Sending this back with one of mine.',
  'Got it! Your courier was a bit muddy but the note was fine.',
];

export function gameNow(world: World, realNow: number): number {
  return realNow + world.clockOffset;
}

export function createWorld(env: Env): World {
  const { now, newId } = env;
  const welcome: Message = {
    id: newId(),
    from: 'hoot',
    to: PLAYER_ID,
    text: 'Welcome to Animal Messenger! Feed your animals, play with them, then send a message. The tortoise is slow, the duckling is clumsy.',
    animalId: '',
    carrier: 'pigeon',
    sentAt: now,
    arriveAt: now + 2 * MINUTE,
    mishap: null,
    status: 'travelling',
    homeAt: null,
    incoming: true,
    read: false,
  };
  return {
    version: 1,
    animals: [
      newAnimal({ id: newId(), speciesId: 'pigeon', name: 'Pip', colour: '#B0A8A0', traits: ['speedy'], now }),
      newAnimal({ id: newId(), speciesId: 'tortoise', name: 'Shelly', colour: '#8AB17D', traits: ['careful', 'cheerful'], now }),
      newAnimal({ id: newId(), speciesId: 'duckling', name: 'Waddles', colour: '#F7DC6F', traits: ['clumsy', 'curious'], now }),
      newAnimal({ id: newId(), speciesId: 'dog', name: 'Biscuit', colour: '#F4A261', traits: ['playful', 'brave'], now }),
      newAnimal({ id: newId(), speciesId: 'cat', name: 'Mittens', colour: '#7FB3D5', traits: ['sleepy', 'foodie'], now }),
    ],
    messages: [welcome],
    eggs: [{ id: newId(), rarity: 'common', foundAt: now }],
    friends: DEMO_FRIENDS,
    cleanDeliveries: 0,
    clockOffset: 0,
  };
}

function replaceById<T extends { id: string }>(list: T[], item: T): T[] {
  return list.map((x) => (x.id === item.id ? item : x));
}

function demoReply(friendId: string, env: Env): Message {
  const quick = SPECIES_LIST.filter((s) => s.deliveryMinutes <= 120);
  const carrier = quick[Math.floor(env.rng() * quick.length)] ?? SPECIES_LIST[0];
  const travel = carrier.deliveryMinutes * MINUTE;
  return {
    id: env.newId(),
    from: friendId,
    to: PLAYER_ID,
    text: DEMO_REPLIES[Math.floor(env.rng() * DEMO_REPLIES.length)],
    animalId: '',
    carrier: carrier.id,
    sentAt: env.now,
    arriveAt: env.now + travel,
    mishap: null,
    status: 'travelling',
    homeAt: null,
    incoming: true,
    read: false,
  };
}

/** Advance every journey and animal to `env.now`. */
function tick(world: World, env: Env): World {
  const { now } = env;
  let cleanDeliveries = world.cleanDeliveries;
  const eggs = [...world.eggs];
  const replies: Message[] = [];

  const messages = world.messages.map((m) => {
    const next = advanceMessage(m, now);
    if (next !== m && !m.incoming && next.status === 'delivered' && m.status === 'travelling') {
      cleanDeliveries += 1;
      if (cleanDeliveries % DELIVERIES_PER_EGG === 0) {
        eggs.push({ id: env.newId(), rarity: rollEggRarity(env.rng), foundAt: now });
      }
      if (world.friends.some((f) => f.id === next.to)) replies.push(demoReply(next.to, env));
    }
    return next;
  });

  const byId = new Map(messages.map((m) => [m.id, m]));
  const animals = world.animals.map((a) => {
    let animal = updateMeters(a, now);
    if (animal.busyWith) {
      const m = byId.get(animal.busyWith);
      const home = !m || m.animalId !== animal.id || (m.homeAt !== null && now >= m.homeAt);
      if (home) {
        animal = { ...animal, busyWith: null, bond: animal.bond + (m?.status === 'delivered' ? 3 : 0) };
      }
    }
    return animal;
  });

  return { ...world, messages: [...messages, ...replies], animals, eggs, cleanDeliveries };
}

export function reduce(world: World, action: Action, env: Env): World {
  const { now, rng } = env;
  const animal = (id: string) => {
    const a = world.animals.find((x) => x.id === id);
    if (!a) throw new Error(`No animal ${id}`);
    return a;
  };
  const message = (id: string) => {
    const m = world.messages.find((x) => x.id === id);
    if (!m) throw new Error(`No message ${id}`);
    return m;
  };

  switch (action.type) {
    case 'tick':
      return tick(world, env);

    case 'feed':
      return { ...world, animals: replaceById(world.animals, feed(animal(action.animalId), action.food, now)) };

    case 'play':
      return { ...world, animals: replaceById(world.animals, play(animal(action.animalId), now)) };

    case 'walk':
      return { ...world, animals: replaceById(world.animals, walk(animal(action.animalId), action.treats, now)) };

    case 'send': {
      const sent = sendMessage({
        id: env.newId(),
        from: PLAYER_ID,
        to: action.to,
        text: action.text,
        animal: animal(action.animalId),
        now,
        rng,
      });
      return {
        ...world,
        animals: replaceById(world.animals, sent.animal),
        messages: [...world.messages, sent.message],
      };
    }

    case 'redirect': {
      const m = message(action.messageId);
      const redirected = redirectFound({
        message: m,
        animal: animal(m.animalId),
        now,
        rng,
        newText: action.newText,
        newTo: action.newTo,
      });
      // Finding a lost animal is rewarded with an egg.
      const egg: Egg = { id: env.newId(), rarity: rollEggRarity(rng), foundAt: now };
      return { ...world, messages: replaceById(world.messages, redirected), eggs: [...world.eggs, egg] };
    }

    case 'resend': {
      const m = message(action.messageId);
      // The previous carrier hurries home so it doesn't stay tied to this message.
      const animals = world.animals.map((a) =>
        a.id === m.animalId && a.busyWith === m.id ? { ...a, busyWith: null } : a,
      );
      const carrier = animals.find((a) => a.id === action.animalId);
      if (!carrier) throw new Error(`No animal ${action.animalId}`);
      const sent = resendMessage({ message: m, animal: carrier, now, rng, newText: action.newText });
      return {
        ...world,
        animals: replaceById(animals, sent.animal),
        messages: replaceById(world.messages, sent.message),
      };
    }

    case 'hatch': {
      const egg = world.eggs.find((e) => e.id === action.eggId);
      if (!egg) throw new Error(`No egg ${action.eggId}`);
      const hatched = hatchEgg({
        egg,
        id: env.newId(),
        name: action.name,
        colour: action.colour,
        traits: action.traits,
        now,
        rng,
      });
      return {
        ...world,
        animals: [...world.animals, hatched],
        eggs: world.eggs.filter((e) => e.id !== egg.id),
      };
    }

    case 'customise': {
      const a = animal(action.animalId);
      const name = action.name?.trim();
      if (action.traits && !validTraits(action.traits)) throw new Error('Pick up to two traits that go together');
      const updated: Animal = {
        ...a,
        name: name || a.name,
        colour: action.colour ?? a.colour,
        traits: action.traits ?? a.traits,
      };
      return { ...world, animals: replaceById(world.animals, updated) };
    }

    case 'read':
      return { ...world, messages: replaceById(world.messages, { ...message(action.messageId), read: true }) };

    case 'skip':
      return { ...world, clockOffset: world.clockOffset + action.ms };
  }
}
