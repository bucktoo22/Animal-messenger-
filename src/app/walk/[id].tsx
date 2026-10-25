import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Animated, Easing, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { canWalk } from '../../game/rules';
import { SPECIES } from '../../game/species';
import { traitFactor } from '../../game/traits';
import type { Animal } from '../../game/types';
import { useGame } from '../../state/GameProvider';
import { TravellingAnimal } from '../../ui/animations';
import { Button, Card, colours, styles } from '../../ui/components';

const ANIMAL_SIZE = 44;
const REACH = 34;
const STEP = 60;
const MAX_TREATS_ON_GROUND = 5;
const TREAT_EMOJIS = ['🦴', '🍎', '⭐', '🥕', '🍪'];
const SCENERY = [
  { emoji: '🌳', x: 0.08, y: 0.1 },
  { emoji: '🌳', x: 0.85, y: 0.18 },
  { emoji: '🌷', x: 0.2, y: 0.82 },
  { emoji: '🪨', x: 0.7, y: 0.75 },
  { emoji: '🌼', x: 0.5, y: 0.05 },
];

type Point = { x: number; y: number };
type Treat = Point & { id: number; emoji: string };

/** Pixels per second across the park. Slow species amble; speedy and sleepy traits change it. */
function walkSpeed(animal: Animal): number {
  const slow = SPECIES[animal.speciesId].deliveryMinutes >= 240;
  return (slow ? 70 : 140) / traitFactor(animal, 'speed');
}

/** Dogs and curious animals can't resist a squirrel. */
function chasesSquirrels(animal: Animal): boolean {
  return animal.speciesId === 'dog' || (animal.traits ?? []).includes('curious');
}

export default function WalkScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { world, dispatch } = useGame();
  const animal = world.animals.find((a) => a.id === id);

  const [park, setPark] = useState<{ w: number; h: number } | null>(null);
  const pos = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const here = useRef<Point>({ x: 0, y: 0 });
  const walking = useRef<Animated.CompositeAnimation | null>(null);
  const [moving, setMoving] = useState(false);
  const [faceRight, setFaceRight] = useState(true);
  const [treats, setTreats] = useState<Treat[]>([]);
  const treatsRef = useRef<Treat[]>([]);
  const [squirrel, setSquirrel] = useState<Point | null>(null);
  const squirrelRef = useRef<Point | null>(null);
  const [found, setFound] = useState(0);
  const [note, setNote] = useState('Tap anywhere in the park, or use the arrows, to walk there.');
  const nextId = useRef(0);
  const parkRef = useRef<ComponentRef<typeof View>>(null);
  const started = useRef(false);

  const randomSpot = (): Point =>
    park
      ? { x: 24 + Math.random() * (park.w - 48), y: 24 + Math.random() * (park.h - 48) }
      : { x: 0, y: 0 };

  const setTreatList = (list: Treat[]) => {
    treatsRef.current = list;
    setTreats(list);
  };
  const setSquirrelAt = (p: Point | null) => {
    squirrelRef.current = p;
    setSquirrel(p);
  };

  const moveTo = (target: Point, speedUp = 1) => {
    if (!park || !animal) return;
    const x = Math.min(park.w - ANIMAL_SIZE / 2, Math.max(ANIMAL_SIZE / 2, target.x));
    const y = Math.min(park.h - ANIMAL_SIZE / 2, Math.max(ANIMAL_SIZE / 2, target.y));
    const from = here.current;
    const distance = Math.hypot(x - from.x, y - from.y);
    if (distance < 2) return;
    if (Math.abs(x - from.x) > 4) setFaceRight(x > from.x);
    walking.current?.stop();
    setMoving(true);
    const run = Animated.timing(pos, {
      toValue: { x, y },
      duration: (distance / (walkSpeed(animal) * speedUp)) * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    });
    walking.current = run;
    run.start(({ finished }) => finished && setMoving(false));
  };

  // Track where the animal is each frame and pick up anything it walks over.
  useEffect(() => {
    const listener = pos.addListener((p) => {
      here.current = p;
      const near = (t: Point) => Math.hypot(t.x - p.x, t.y - p.y) < REACH;
      const picked = treatsRef.current.filter(near);
      if (picked.length) {
        setTreatList(treatsRef.current.filter((t) => !near(t)));
        setFound((f) => f + picked.length);
        setNote(`Found ${picked.map((t) => t.emoji).join(' ')}!`);
      }
      if (squirrelRef.current && near(squirrelRef.current)) {
        setSquirrelAt(null);
        setFound((f) => f + 2);
        setNote('Caught up with the squirrel! It dropped two acorns. 🌰🌰');
      }
    });
    return () => pos.removeListener(listener);
  }, [pos]);

  // Start in the middle with some treats scattered about (once, even if the park resizes).
  useEffect(() => {
    if (!park || started.current) return;
    started.current = true;
    const start = { x: park.w / 2, y: park.h / 2 };
    pos.setValue(start);
    here.current = start;
    setTreatList(
      Array.from({ length: MAX_TREATS_ON_GROUND }, () => ({
        id: nextId.current++,
        emoji: TREAT_EMOJIS[Math.floor(Math.random() * TREAT_EMOJIS.length)],
        ...randomSpot(),
      })),
    );
  }, [park?.w, park?.h]);

  // New treats appear now and then, and sometimes a squirrel.
  useEffect(() => {
    if (!park || !animal) return;
    const treatTimer = setInterval(() => {
      if (treatsRef.current.length < MAX_TREATS_ON_GROUND) {
        setTreatList([
          ...treatsRef.current,
          { id: nextId.current++, emoji: TREAT_EMOJIS[Math.floor(Math.random() * TREAT_EMOJIS.length)], ...randomSpot() },
        ]);
      }
    }, 3000);
    const squirrelTimer = setInterval(() => {
      if (squirrelRef.current || Math.random() < 0.4) return;
      const spot = randomSpot();
      setSquirrelAt(spot);
      if (chasesSquirrels(animal)) {
        setNote(`${animal.name} spotted a squirrel and ran after it!`);
        setTimeout(() => squirrelRef.current && moveTo(squirrelRef.current, 1.8), 500);
      } else {
        setNote('A squirrel! Catch it before it runs off.');
      }
      setTimeout(() => {
        if (squirrelRef.current === spot) {
          setSquirrelAt(null);
          setNote('The squirrel ran up a tree.');
        }
      }, 4500);
    }, 8000);
    return () => {
      clearInterval(treatTimer);
      clearInterval(squirrelTimer);
      walking.current?.stop();
    };
  }, [park?.w, park?.h, animal?.id]);

  if (!animal) return <Text style={styles.body}>This animal has wandered off.</Text>;
  if (!canWalk(animal) && found === 0) {
    return (
      <View style={[styles.screen, styles.content]}>
        <Text style={styles.body}>
          {animal.busyWith ? `${animal.name} is out on a delivery.` : `${animal.name} is too tired for a walk. Let it rest first.`}
        </Text>
      </View>
    );
  }

  const step = (dx: number, dy: number) => moveTo({ x: here.current.x + dx * STEP, y: here.current.y + dy * STEP });
  const arrow = (label: string, glyph: string, dx: number, dy: number) => (
    <Pressable accessibilityLabel={label} onPress={() => step(dx, dy)} style={[styles.button, styles.buttonSecondary, { width: 56 }]}>
      <Text style={{ fontSize: 20, color: colours.accent }}>{glyph}</Text>
    </Pressable>
  );

  return (
    <View style={[styles.screen, styles.content, { flex: 1 }]}>
      <Stack.Screen options={{ title: `Walking ${animal.name}` }} />
      <Text style={[styles.body, { minHeight: 42 }]} numberOfLines={2}>
        {note}
      </Text>
      <Pressable
        accessibilityLabel="Park"
        onLayout={(e: LayoutChangeEvent) => setPark({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
        ref={parkRef}
        onPress={(e) => {
          // locationX isn't reliable on web, so work it out from the page position.
          const { pageX, pageY } = e.nativeEvent;
          parkRef.current?.measureInWindow((x, y) => moveTo({ x: pageX - x, y: pageY - y }));
        }}
        style={{ flex: 1, minHeight: 280, borderRadius: 20, backgroundColor: '#CDE8B5', overflow: 'hidden' }}
      >
        {park && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
            {SCENERY.map((s, i) => (
              <Text key={i} style={{ position: 'absolute', left: s.x * park.w, top: s.y * park.h, fontSize: 30, opacity: 0.9 }}>
                {s.emoji}
              </Text>
            ))}
            {treats.map((t) => (
              <Text key={t.id} style={{ position: 'absolute', left: t.x - 12, top: t.y - 14, fontSize: 22 }}>
                {t.emoji}
              </Text>
            ))}
            {squirrel && (
              <Text style={{ position: 'absolute', left: squirrel.x - 14, top: squirrel.y - 16, fontSize: 28 }}>🐿️</Text>
            )}
            <Animated.View
              style={{
                position: 'absolute',
                left: -ANIMAL_SIZE / 2,
                top: -ANIMAL_SIZE / 2,
                width: ANIMAL_SIZE,
                height: ANIMAL_SIZE,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateX: pos.x }, { translateY: pos.y }],
              }}
            >
              <TravellingAnimal emoji={SPECIES[animal.speciesId].emoji} walking={moving} faceRight={faceRight} style={{ fontSize: 36 }} />
            </Animated.View>
          </View>
        )}
      </Pressable>

      <View style={[styles.row, { justifyContent: 'center', gap: 8 }]}>
        {arrow('Walk left', '◀', -1, 0)}
        {arrow('Walk up', '▲', 0, -1)}
        {arrow('Walk down', '▼', 0, 1)}
        {arrow('Walk right', '▶', 1, 0)}
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.h2, { flex: 1 }]}>Treats found: {found}</Text>
        <View style={{ width: 150 }}>
          <Button
            title="Finish walk"
            onPress={() => {
              dispatch({ type: 'walk', animalId: animal.id, treats: found });
              router.back();
            }}
          />
        </View>
      </Card>
    </View>
  );
}
