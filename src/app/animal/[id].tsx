import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { canPlay, deliveryDuration, mishapChance } from '../../game/rules';
import { FOODS, SPECIES } from '../../game/species';
import type { FoodId } from '../../game/types';
import { useGame } from '../../state/GameProvider';
import { AnimalAvatar, Button, Card, Meter, colours, formatDuration, styles } from '../../ui/components';

const CATCHES_TO_WIN = 5;

/** Tap the ball as it hops around. Five catches and your animal is happier. */
function FetchGame({ emoji, onDone }: { emoji: string; onDone: () => void }) {
  const [catches, setCatches] = useState(0);
  const [pos, setPos] = useState({ x: 40, y: 40 });

  const hop = () => {
    const next = catches + 1;
    if (next >= CATCHES_TO_WIN) return onDone();
    setCatches(next);
    setPos({ x: 5 + Math.random() * 75, y: 5 + Math.random() * 70 });
  };

  return (
    <View style={{ height: 220, borderRadius: 12, backgroundColor: '#EAF4E2', overflow: 'hidden' }}>
      <Text style={[styles.quiet, { padding: 8 }]}>
        Catch the ball! {catches}/{CATCHES_TO_WIN}
      </Text>
      <Text style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 32 }}>{emoji}</Text>
      <Pressable
        onPress={hop}
        hitSlop={12}
        style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%` }}
        accessibilityLabel="Ball"
      >
        <Text style={{ fontSize: 36 }}>🎾</Text>
      </Pressable>
    </View>
  );
}

export default function AnimalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { world, dispatch } = useGame();
  const [playing, setPlaying] = useState(false);
  const animal = world.animals.find((a) => a.id === id);
  if (!animal) return <Text style={styles.body}>This animal has wandered off.</Text>;

  const species = SPECIES[animal.speciesId];
  const busy = !!animal.busyWith;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: animal.name }} />
      <Card style={{ alignItems: 'center' }}>
        <AnimalAvatar animal={animal} size={110} />
        <Text style={styles.h1}>{animal.name}</Text>
        <Text style={styles.quiet}>
          {species.name} · {species.rarity} · bond {animal.bond}
        </Text>
        <Text style={[styles.body, { textAlign: 'center' }]}>{species.personality}</Text>
        <Text style={styles.quiet}>
          Delivers in about {formatDuration(deliveryDuration(animal))} · {Math.round(mishapChance(animal) * 100)}% mishap risk
        </Text>
      </Card>

      <Card>
        <Meter label="Food" value={animal.meters.hunger} />
        <Meter label="Energy" value={animal.meters.energy} />
        <Meter label="Happiness" value={animal.meters.happiness} />
        <Text style={styles.quiet}>
          {busy ? 'Out on a delivery. Energy recovers once home.' : 'Resting at home: energy recovers over time.'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.h2}>Feed</Text>
        <Text style={styles.quiet}>
          Favourite: {FOODS[species.favouriteFood].emoji} {FOODS[species.favouriteFood].name} (fills more)
        </Text>
        <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
          {(Object.keys(FOODS) as FoodId[]).map((food) => (
            <Pressable
              key={food}
              style={[styles.chip, food === species.favouriteFood && styles.chipSelected]}
              onPress={() => dispatch({ type: 'feed', animalId: animal.id, food })}
              disabled={busy}
            >
              <Text style={{ color: busy ? colours.quiet : colours.ink }}>
                {FOODS[food].emoji} {FOODS[food].name}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.h2}>Play</Text>
        {playing ? (
          <FetchGame
            emoji={species.emoji}
            onDone={() => {
              dispatch({ type: 'play', animalId: animal.id });
              setPlaying(false);
            }}
          />
        ) : (
          <Button
            title={busy ? 'Out delivering' : canPlay(animal) ? 'Play fetch' : 'Too tired to play'}
            onPress={() => setPlaying(true)}
            disabled={!canPlay(animal)}
          />
        )}
      </Card>
    </ScrollView>
  );
}
