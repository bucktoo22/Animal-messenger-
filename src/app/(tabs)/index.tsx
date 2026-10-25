import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { HOUR } from '../../game/rules';
import { SPECIES } from '../../game/species';
import type { Animal, Message } from '../../game/types';
import type { World } from '../../game/world';
import { useGame } from '../../state/GameProvider';
import { AnimalAvatar, Button, Card, Meter, formatDuration, styles } from '../../ui/components';

function statusLine(animal: Animal, world: World, now: number): string {
  if (!animal.busyWith) return 'At home';
  const m: Message | undefined = world.messages.find((x) => x.id === animal.busyWith);
  if (!m) return 'At home';
  const friend = world.friends.find((f) => f.id === m.to)?.name ?? 'a friend';
  switch (m.status) {
    case 'travelling':
      return `Carrying a message to ${friend}`;
    case 'lost':
      return 'Lost! Go to Mail to search for it';
    case 'dropped':
    case 'delivered':
    case 'returned':
      return `Walking home, back in ${formatDuration((m.homeAt ?? now) - now)}`;
  }
}

export default function AnimalsScreen() {
  const { world, now, dispatch, reset } = useGame();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {world.animals.map((a) => (
        <Link key={a.id} href={`/animal/${a.id}`} asChild>
          <Pressable>
            <Card>
              <View style={styles.row}>
                <AnimalAvatar animal={a} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>{a.name}</Text>
                  <Text style={styles.quiet}>
                    {SPECIES[a.speciesId].name} · {SPECIES[a.speciesId].rarity} · bond {a.bond}
                  </Text>
                  <Text style={styles.quiet}>{statusLine(a, world, now)}</Text>
                </View>
              </View>
              <Meter label="Food" value={a.meters.hunger} />
              <Meter label="Energy" value={a.meters.energy} />
              <Meter label="Happiness" value={a.meters.happiness} />
            </Card>
          </Pressable>
        </Link>
      ))}

      <Card>
        <Text style={styles.h2}>Testing tools</Text>
        <Text style={styles.quiet}>
          Slow animals take hours. Skip ahead to see deliveries, mishaps and hungry animals without waiting.
        </Text>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Button kind="secondary" title="Skip 1 hour" onPress={() => dispatch({ type: 'skip', ms: HOUR })} />
          </View>
          <View style={{ flex: 1 }}>
            <Button kind="secondary" title="Skip 1 day" onPress={() => dispatch({ type: 'skip', ms: 24 * HOUR })} />
          </View>
        </View>
        <Button kind="secondary" title="Start over" onPress={reset} />
      </Card>
    </ScrollView>
  );
}
