import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SEND_ENERGY_COST, canSend, deliveryDuration, mishapChance } from '../../game/rules';
import { SPECIES } from '../../game/species';
import { useGame } from '../../state/GameProvider';
import { AnimalAvatar, Button, Card, colours, formatDuration, styles } from '../../ui/components';

/**
 * Write a message and choose who carries it. With `?resend=<id>` it sends a dropped
 * or returned message again instead of a new one.
 */
export default function SendScreen() {
  const { resend } = useLocalSearchParams<{ resend?: string }>();
  const { world, now, dispatch } = useGame();
  const original = resend ? world.messages.find((m) => m.id === resend) : undefined;

  const [to, setTo] = useState(world.friends[0]?.id);
  const [text, setText] = useState('');
  const [animalId, setAnimalId] = useState<string | null>(null);

  useEffect(() => {
    if (original) {
      setTo(original.to);
      setText(original.text);
    }
  }, [original?.id]);

  const chosen = world.animals.find((a) => a.id === animalId);
  const ready = !!to && text.trim().length > 0 && !!chosen && canSend(chosen);

  const send = () => {
    if (!ready || !chosen || !to) return;
    if (original) {
      dispatch({ type: 'resend', messageId: original.id, animalId: chosen.id, newText: text.trim() });
    } else {
      dispatch({ type: 'send', animalId: chosen.id, to, text: text.trim() });
    }
    setText('');
    setAnimalId(null);
    router.replace('/mail');
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {original && (
        <Card style={{ borderColor: colours.warn }}>
          <Text style={styles.body}>Sending your message again. You can change the words or pick a new carrier.</Text>
        </Card>
      )}

      <Text style={styles.h2}>To</Text>
      <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
        {world.friends.map((f) => (
          <Pressable
            key={f.id}
            style={[styles.chip, to === f.id && styles.chipSelected]}
            onPress={() => setTo(f.id)}
            disabled={!!original}
          >
            <Text style={{ color: colours.ink }}>
              {f.emoji} {f.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.h2}>Message</Text>
      <TextInput
        style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
        multiline
        maxLength={280}
        placeholder="Write something nice..."
        placeholderTextColor={colours.quiet}
        value={text}
        onChangeText={setText}
      />

      <Text style={styles.h2}>Who carries it?</Text>
      {world.animals.map((a) => {
        const available = canSend(a);
        const reason = a.busyWith ? 'Out on a trip' : `Too tired (needs ${SEND_ENERGY_COST} energy)`;
        return (
          <Pressable key={a.id} onPress={() => setAnimalId(a.id)} disabled={!available}>
            <Card style={[animalId === a.id ? styles.chipSelected : {}, !available ? { opacity: 0.45 } : {}]}>
              <View style={styles.row}>
                <AnimalAvatar animal={a} size={44} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.h2}>
                    {a.name} the {SPECIES[a.speciesId].name}
                  </Text>
                  <Text style={styles.quiet}>
                    {available
                      ? `Arrives in about ${formatDuration(deliveryDuration(a))} · ${Math.round(mishapChance(a) * 100)}% mishap risk`
                      : reason}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        );
      })}

      {chosen && (
        <Text style={styles.quiet}>
          {chosen.name} should arrive around{' '}
          {new Date(now + deliveryDuration(chosen)).toLocaleString([], {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })}
          .
        </Text>
      )}
      <Button title={original ? 'Send again' : 'Send'} onPress={send} disabled={!ready} />
    </ScrollView>
  );
}
