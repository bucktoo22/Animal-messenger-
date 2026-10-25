import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput } from 'react-native';
import { ANIMAL_COLOURS, SPECIES } from '../../game/species';
import type { TraitId } from '../../game/types';
import { useGame } from '../../state/GameProvider';
import { AnimalAvatar, Button, Card, ColourPicker, TraitPicker, colours, styles, traitLabel } from '../../ui/components';

/** Name, colour and personality first, then crack the egg to see what it is. */
export default function HatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { world, dispatch } = useGame();
  const [name, setName] = useState('');
  const [colour, setColour] = useState(ANIMAL_COLOURS[0]);
  const [traits, setTraits] = useState<TraitId[]>([]);
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
          <Text style={styles.body}>{traitLabel(hatched.traits)}</Text>
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
      <ColourPicker value={colour} onChange={setColour} />
      <Text style={styles.h2}>Personality</Text>
      <Text style={styles.quiet}>Pick up to 2, or leave them empty for a surprise.</Text>
      <TraitPicker value={traits} onChange={setTraits} />
      <Button
        title="Hatch!"
        disabled={!name.trim()}
        onPress={() =>
          dispatch({ type: 'hatch', eggId: egg.id, name: name.trim(), colour, traits: traits.length ? traits : undefined })
        }
      />
    </ScrollView>
  );
}
