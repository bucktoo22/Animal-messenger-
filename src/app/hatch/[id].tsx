import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ANIMAL_COLOURS, SPECIES } from '../../game/species';
import { useGame } from '../../state/GameProvider';
import { AnimalAvatar, Button, Card, colours, styles } from '../../ui/components';

/** Name and colour the animal, then crack the egg to see what it is. */
export default function HatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { world, dispatch } = useGame();
  const [name, setName] = useState('');
  const [colour, setColour] = useState(ANIMAL_COLOURS[0]);
  const [countBefore] = useState(world.animals.length);

  // Hatching appends the new animal, so anything past the starting count is it.
  const hatched = world.animals.at(countBefore);

  if (hatched) {
    const s = SPECIES[hatched.speciesId];
    return (
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={{ alignItems: 'center' }}>
          <Text style={styles.h1}>It's a {s.name}!</Text>
          <AnimalAvatar animal={hatched} size={120} />
          <Text style={styles.h2}>
            {hatched.name} · {s.rarity}
          </Text>
          <Text style={[styles.body, { textAlign: 'center' }]}>{s.personality}</Text>
        </Card>
        <Button title={`Meet ${hatched.name}`} onPress={() => router.replace(`/animal/${hatched.id}`)} />
      </ScrollView>
    );
  }

  const egg = world.eggs.find((e) => e.id === id);
  if (!egg) return <Text style={styles.body}>This egg has already hatched.</Text>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 80 }}>🥚</Text>
        <Text style={styles.quiet}>Something is wriggling inside...</Text>
      </Card>
      <Text style={styles.h2}>Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Biscuit"
        placeholderTextColor={colours.quiet}
        maxLength={20}
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.h2}>Colour</Text>
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {ANIMAL_COLOURS.map((c) => (
          <Pressable
            key={c}
            accessibilityLabel={`Colour ${c}`}
            onPress={() => setColour(c)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: c,
              borderWidth: 3,
              borderColor: c === colour ? colours.ink : 'transparent',
            }}
          />
        ))}
      </View>
      <Button
        title="Hatch!"
        disabled={!name.trim()}
        onPress={() => dispatch({ type: 'hatch', eggId: egg.id, name: name.trim(), colour })}
      />
    </ScrollView>
  );
}
