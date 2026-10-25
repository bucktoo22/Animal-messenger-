import { describe, expect, it } from 'vitest';
import {
  HOUR,
  LOST_AUTO_RETURN,
  MINUTE,
  advanceMessage,
  deliveryDuration,
  feed,
  journeyProgress,
  mishapChance,
  newAnimal,
  play,
  redirectFound,
  walk,
  rollEggRarity,
  sendMessage,
  updateMeters,
} from './rules';
import { EGG_ODDS, SPECIES_LIST } from './species';
import { randomTraits, validTraits } from './traits';
import { createWorld, reduce, type Env, type World } from './world';

const T0 = Date.UTC(2026, 9, 25, 12);
/** An rng that returns the given values in order, then repeats the last one. */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
const pigeon = () => newAnimal({ id: 'a1', speciesId: 'pigeon', name: 'Pip', colour: '#fff', now: T0 });
const tortoise = () => newAnimal({ id: 'a2', speciesId: 'tortoise', name: 'Shelly', colour: '#fff', now: T0 });
const duckling = () => newAnimal({ id: 'a3', speciesId: 'duckling', name: 'Waddles', colour: '#fff', now: T0 });

describe('care', () => {
  it('hunger and happiness drop over time and energy recovers at home', () => {
    const a = { ...pigeon(), meters: { hunger: 80, energy: 50, happiness: 80 } };
    const later = updateMeters(a, T0 + 5 * HOUR);
    expect(later.meters).toEqual({ hunger: 60, energy: 100, happiness: 65 });
  });

  it('favourite food fills more and feeding builds bond', () => {
    const a = { ...pigeon(), meters: { hunger: 10, energy: 100, happiness: 80 } };
    expect(feed(a, 'seeds', T0).meters.hunger).toBe(50);
    expect(feed(a, 'fish', T0).meters.hunger).toBe(35);
    expect(feed(a, 'seeds', T0).bond).toBe(1);
  });

  it('play raises happiness and costs energy', () => {
    const a = { ...pigeon(), meters: { hunger: 80, energy: 50, happiness: 40 } };
    const after = play(a, T0);
    expect(after.meters.happiness).toBe(70);
    expect(after.meters.energy).toBe(40);
  });
});

describe('walks', () => {
  it('finding treats makes a walk better and builds bond', () => {
    const a = { ...pigeon(), meters: { hunger: 80, energy: 50, happiness: 20 } };
    expect(walk(a, 0, T0).meters).toEqual({ hunger: 80, energy: 40, happiness: 30 });
    const good = walk(a, 6, T0);
    expect(good.meters.happiness).toBe(60);
    expect(good.bond).toBe(3);
  });

  it("can't walk an animal that is out or worn out", () => {
    const tired = { ...pigeon(), meters: { hunger: 80, energy: 5, happiness: 20 } };
    expect(walk(tired, 3, T0)).toEqual(tired);
  });
});

describe('delivery', () => {
  it('slow animals take about a day and fast ones minutes', () => {
    expect(deliveryDuration(tortoise())).toBe(24 * HOUR);
    expect(deliveryDuration(pigeon())).toBe(10 * MINUTE);
  });

  it('a well-bonded animal is faster, a grumpy one slower', () => {
    expect(deliveryDuration({ ...pigeon(), bond: 50 })).toBe(7.5 * MINUTE);
    const grumpy = { ...pigeon(), meters: { hunger: 10, energy: 20, happiness: 10 } };
    expect(deliveryDuration(grumpy)).toBe(13 * MINUTE);
  });

  it('clumsy animals are riskier, and hunger makes it worse', () => {
    expect(mishapChance(duckling())).toBeCloseTo(0.15);
    expect(mishapChance(tortoise())).toBeCloseTo(0.01);
    const hungry = { ...duckling(), meters: { hunger: 10, energy: 100, happiness: 80 } };
    expect(mishapChance(hungry)).toBeCloseTo(0.225);
  });

  it('a clean trip is delivered on time and the animal walks home', () => {
    const { message, animal } = sendMessage({
      id: 'm1', from: 'me', to: 'maya', text: 'hi', animal: pigeon(), now: T0, rng: seq(0.99),
    });
    expect(animal.busyWith).toBe('m1');
    expect(message.mishap).toBeNull();
    expect(advanceMessage(message, T0 + 9 * MINUTE).status).toBe('travelling');
    const done = advanceMessage(message, T0 + 10 * MINUTE);
    expect(done.status).toBe('delivered');
    expect(done.homeAt).toBe(T0 + 15 * MINUTE);
  });
});

describe('mishaps', () => {
  it('a dropped message stops part way and the animal comes home alone', () => {
    // 0.0 = mishap happens, 0.99 = dropped (not lost), 0.5 = 55% of the way.
    const { message } = sendMessage({
      id: 'm1', from: 'me', to: 'maya', text: 'hi', animal: duckling(), now: T0, rng: seq(0, 0.99, 0.5),
    });
    expect(message.mishap).toEqual({ kind: 'dropped', at: T0 + 66 * MINUTE });
    const later = advanceMessage(message, T0 + 70 * MINUTE);
    expect(later.status).toBe('dropped');
    expect(later.homeAt).toBe(T0 + 132 * MINUTE);
    expect(journeyProgress(later, T0 + 100 * MINUTE)).toBeCloseTo(0.55);
  });

  it('a lost animal can be found and carries on from where it was', () => {
    const { message, animal } = sendMessage({
      id: 'm1', from: 'me', to: 'maya', text: 'hi', animal: duckling(), now: T0, rng: seq(0, 0, 0.5),
    });
    const lost = advanceMessage(message, T0 + 70 * MINUTE);
    expect(lost.status).toBe('lost');
    expect(lost.homeAt).toBeNull();

    const found = redirectFound({ message: lost, animal, now: T0 + 3 * HOUR, rng: seq(0.99) });
    expect(found.status).toBe('travelling');
    expect(found.arriveAt - (T0 + 3 * HOUR)).toBe(54 * MINUTE);
    expect(journeyProgress(found, T0 + 3 * HOUR)).toBeCloseTo(0.55);
    expect(advanceMessage(found, T0 + 4 * HOUR).status).toBe('delivered');
  });

  it('a lost animal nobody looks for comes home after a day', () => {
    const { message } = sendMessage({
      id: 'm1', from: 'me', to: 'maya', text: 'hi', animal: duckling(), now: T0, rng: seq(0, 0, 0.5),
    });
    const returned = advanceMessage(message, T0 + 66 * MINUTE + LOST_AUTO_RETURN);
    expect(returned.status).toBe('returned');
  });
});

describe('eggs', () => {
  it('follows the rarity odds', () => {
    expect(rollEggRarity(() => 0.5)).toBe('common');
    expect(rollEggRarity(() => 0.7)).toBe('uncommon');
    expect(rollEggRarity(() => 0.95)).toBe('rare');
  });

  it('every rarity in the odds has species to hatch', () => {
    for (const { rarity } of EGG_ODDS) {
      expect(SPECIES_LIST.some((s) => s.rarity === rarity)).toBe(true);
    }
  });
});

describe('world', () => {
  let ids = 0;
  const env = (now: number, rng = seq(0.99)): Env => ({ now, rng, newId: () => `id${ids++}` });

  it('frees the animal once it is home and earns an egg every third delivery', () => {
    let w: World = createWorld(env(T0));
    const pip = w.animals.find((a) => a.speciesId === 'pigeon')!;
    const eggsBefore = w.eggs.length;
    let t = T0;
    for (let i = 0; i < 3; i++) {
      w = reduce(w, { type: 'send', animalId: pip.id, to: 'maya', text: `hi ${i}` }, env(t));
      expect(w.animals.find((a) => a.id === pip.id)!.busyWith).not.toBeNull();
      t += 16 * MINUTE;
      w = reduce(w, { type: 'tick' }, env(t));
      expect(w.animals.find((a) => a.id === pip.id)!.busyWith).toBeNull();
    }
    expect(w.cleanDeliveries).toBe(3);
    expect(w.eggs.length).toBe(eggsBefore + 1);
    // Demo friends write back.
    expect(w.messages.filter((m) => m.incoming && m.from === 'maya').length).toBe(3);
  });

  it('hatches an egg into a new animal', () => {
    let w = createWorld(env(T0));
    const egg = w.eggs[0];
    w = reduce(w, { type: 'hatch', eggId: egg.id, name: 'Nibbles', colour: '#fff' }, env(T0, seq(0.4)));
    expect(w.eggs).toHaveLength(0);
    expect(w.animals.at(-1)!.name).toBe('Nibbles');
  });
});

describe('personality traits', () => {
  it('change speed, mishaps and meters', () => {
    expect(deliveryDuration({ ...pigeon(), traits: ['speedy'] })).toBe(8 * MINUTE);
    expect(mishapChance({ ...duckling(), traits: ['careful'] })).toBeCloseTo(0.09);
    const foodie = { ...pigeon(), traits: ['foodie' as const], meters: { hunger: 10, energy: 100, happiness: 80 } };
    expect(feed(foodie, 'seeds', T0).meters.hunger).toBe(60);
    expect(updateMeters(foodie, T0 + 2 * HOUR).meters.hunger).toBe(0);
  });

  it('random traits never clash', () => {
    for (let i = 0; i < 50; i++) expect(validTraits(randomTraits(Math.random))).toBe(true);
    expect(validTraits(['speedy', 'sleepy'])).toBe(false);
    expect(validTraits(['speedy', 'brave', 'cheerful'])).toBe(false);
  });

  it('lets you rename, recolour and change traits', () => {
    let ids = 0;
    const env: Env = { now: T0, rng: seq(0.5), newId: () => `c${ids++}` };
    let w = createWorld(env);
    const a = w.animals[0];
    w = reduce(w, { type: 'customise', animalId: a.id, name: 'Zoom', colour: '#000', traits: ['brave'] }, env);
    expect(w.animals[0]).toMatchObject({ name: 'Zoom', colour: '#000', traits: ['brave'] });
    expect(() => reduce(w, { type: 'customise', animalId: a.id, traits: ['brave', 'curious'] }, env)).toThrow();
  });
});
