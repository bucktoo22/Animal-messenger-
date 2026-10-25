import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createWorld, gameNow, reduce, type Action, type Env, type World } from '../game/world';

const STORAGE_KEY = 'animal-messenger/world/v1';

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const makeEnv = (now: number): Env => ({ now, rng: Math.random, newId });

interface GameContextValue {
  world: World;
  /** Current game time (real time plus any skip-ahead). */
  now: number;
  dispatch: (action: Action) => void;
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [world, setWorld] = useState<World | null>(null);
  const [realNow, setRealNow] = useState(Date.now());
  const worldRef = useRef<World | null>(null);
  worldRef.current = world;

  // Load the saved game, or start a new one.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => (raw ? (JSON.parse(raw) as World) : null))
      .catch(() => null)
      .then((saved) => setWorld(saved ?? createWorld(makeEnv(Date.now()))));
  }, []);

  // Save after every change.
  useEffect(() => {
    if (world) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(world)).catch(() => {});
  }, [world]);

  const dispatch = useCallback((action: Action) => {
    setWorld((w) => {
      if (!w) return w;
      let next: World;
      try {
        next = reduce(w, action, makeEnv(gameNow(w, Date.now())));
      } catch (e) {
        // Screens disable actions that aren't allowed, so this only guards against races.
        console.warn(e);
        return w;
      }
      // Skipping ahead changes the clock, so bring everything up to the new time straight away.
      return action.type === 'skip' ? reduce(next, { type: 'tick' }, makeEnv(gameNow(next, Date.now()))) : next;
    });
  }, []);

  // Journeys and meters move on every second.
  useEffect(() => {
    const timer = setInterval(() => {
      setRealNow(Date.now());
      dispatch({ type: 'tick' });
    }, 1000);
    return () => clearInterval(timer);
  }, [dispatch]);

  const reset = useCallback(() => setWorld(createWorld(makeEnv(Date.now()))), []);

  if (!world) return null;
  return (
    <GameContext.Provider value={{ world, now: gameNow(world, realNow), dispatch, reset }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
