export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

export type SpeciesId = 'pigeon' | 'tortoise' | 'cat' | 'duckling' | 'fox';

export interface Species {
  id: SpeciesId;
  name: string;
  emoji: string;
  rarity: Rarity;
  /** Base one-way delivery time in minutes. */
  deliveryMinutes: number;
  /** Base chance (0 to 1) that a trip goes wrong. */
  baseMishapChance: number;
  /** Of the mishaps, the share that are "got lost" rather than "dropped the message". */
  lostShare: number;
  favouriteFood: FoodId;
  personality: string;
}

export type FoodId = 'seeds' | 'lettuce' | 'fish' | 'bread' | 'berries';

export interface Meters {
  /** 0 to 100. Higher is better (100 = full). */
  hunger: number;
  energy: number;
  happiness: number;
}

export interface Animal {
  id: string;
  speciesId: SpeciesId;
  name: string;
  colour: string;
  meters: Meters;
  /** Game time when meters were last brought up to date. */
  metersUpdatedAt: number;
  /** Grows with care and deliveries. */
  bond: number;
  /** Message id while out on a trip. */
  busyWith: string | null;
}

export type MishapKind = 'dropped' | 'lost';

export type MessageStatus =
  | 'travelling'
  | 'delivered'
  | 'dropped'
  | 'lost'
  | 'returned';

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  animalId: string;
  sentAt: number;
  /** When the animal arrives if nothing goes wrong. */
  arriveAt: number;
  /** Rolled at send time. Null means a clean trip. */
  mishap: { kind: MishapKind; at: number } | null;
  status: MessageStatus;
  /** When the animal is back home and free again. */
  homeAt: number | null;
  /** True for messages other people sent to the player. */
  incoming: boolean;
  /** For incoming messages: the species carrying it (the animal isn't one of ours). */
  carrier?: SpeciesId;
  read: boolean;
}

export interface Egg {
  id: string;
  rarity: Rarity;
  foundAt: number;
}

export interface Friend {
  id: string;
  name: string;
  emoji: string;
}
