import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { journeyProgress } from '../../game/rules';
import { SPECIES } from '../../game/species';
import { useGame } from '../../state/GameProvider';
import { Button, Card, JourneyPath, colours, formatDuration, styles } from '../../ui/components';

/** Tap the hiding spots until you find what you're looking for. Wrong spots show footprints. */
function SearchGame({ spots, hidden, cover, onFound }: { spots: number; hidden: string; cover: string; onFound: () => void }) {
  const target = useMemo(() => Math.floor(Math.random() * spots), [spots]);
  const [peeked, setPeeked] = useState<number[]>([]);
  const found = peeked.includes(target);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
        {Array.from({ length: spots }, (_, i) => {
          const open = peeked.includes(i);
          return (
            <Pressable
              key={i}
              accessibilityLabel={`Hiding spot ${i + 1}`}
              onPress={() => setPeeked((p) => (p.includes(i) ? p : [...p, i]))}
              disabled={found}
              style={{
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: open ? '#F3EADF' : '#DCEFD2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 38 }}>{open ? (i === target ? hidden : '🐾') : cover}</Text>
            </Pressable>
          );
        })}
      </View>
      {found ? <Button title="Found it!" onPress={onFound} /> : <Text style={[styles.quiet, { textAlign: 'center' }]}>Tap to look</Text>}
    </View>
  );
}

export default function MessageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { world, now, dispatch } = useGame();
  const [found, setFound] = useState(false);
  const [newText, setNewText] = useState<string | null>(null);
  const [newTo, setNewTo] = useState<string | null>(null);

  const message = world.messages.find((m) => m.id === id);

  useEffect(() => {
    if (message?.incoming && message.status === 'delivered' && !message.read) {
      dispatch({ type: 'read', messageId: message.id });
    }
  }, [message?.status]);

  if (!message) return <Text style={styles.body}>This message has gone missing.</Text>;

  const friendName = (fid: string) => world.friends.find((f) => f.id === fid)?.name ?? 'Someone';
  const animal = world.animals.find((a) => a.id === message.animalId);
  const emoji = message.incoming ? SPECIES[message.carrier ?? 'pigeon'].emoji : animal ? SPECIES[animal.speciesId].emoji : '🐾';
  const name = animal?.name ?? 'Your animal';

  const body = () => {
    if (message.incoming) {
      if (message.status === 'travelling') {
        return (
          <Card>
            <Text style={styles.body}>A {SPECIES[message.carrier ?? 'pigeon'].name.toLowerCase()} is bringing something from {friendName(message.from)}.</Text>
            <JourneyPath progress={journeyProgress(message, now)} emoji={emoji} />
            <Text style={styles.quiet}>Arrives in {formatDuration(message.arriveAt - now)}. You'll see the words when it lands.</Text>
          </Card>
        );
      }
      return (
        <>
          <Card>
            <Text style={styles.quiet}>
              From {friendName(message.from)} · delivered by {emoji}
            </Text>
            <Text style={[styles.body, { fontSize: 17 }]}>{message.text}</Text>
          </Card>
          <Button title={`Reply to ${friendName(message.from)}`} onPress={() => router.push('/send')} />
        </>
      );
    }

    switch (message.status) {
      case 'travelling':
        return (
          <Card>
            <Text style={styles.body}>
              {name} is carrying your message to {friendName(message.to)}.
            </Text>
            <JourneyPath progress={journeyProgress(message, now)} emoji={emoji} />
            <Text style={styles.quiet}>Arrives in about {formatDuration(message.arriveAt - now)}</Text>
            <Text style={[styles.body, { fontStyle: 'italic' }]}>"{message.text}"</Text>
          </Card>
        );

      case 'delivered':
        return (
          <Card>
            <Text style={styles.body}>
              ✅ {name} delivered your message to {friendName(message.to)}.
            </Text>
            <Text style={[styles.body, { fontStyle: 'italic' }]}>"{message.text}"</Text>
          </Card>
        );

      case 'dropped':
        return (
          <Card>
            <Text style={styles.body}>
              Oops! {name} dropped your message {Math.round(journeyProgress(message, now) * 100)}% of the way to {friendName(message.to)} and is wandering home.
            </Text>
            <JourneyPath progress={journeyProgress(message, now)} emoji="✉️" trouble />
            {found ? (
              <Button title="Choose who carries it now" onPress={() => router.push(`/send?resend=${message.id}`)} />
            ) : (
              <>
                <Text style={styles.h2}>Find the message on the path</Text>
                <SearchGame spots={4} hidden="✉️" cover="🍂" onFound={() => setFound(true)} />
                <Button kind="secondary" title="Just write a new one" onPress={() => router.push(`/send?resend=${message.id}`)} />
              </>
            )}
          </Card>
        );

      case 'returned':
        return (
          <Card>
            <Text style={styles.body}>
              Nobody came looking, so {name} found its own way home. Your message is safe.
            </Text>
            <Button title="Send it again" onPress={() => router.push(`/send?resend=${message.id}`)} />
          </Card>
        );

      case 'lost': {
        const giveUpIn = message.mishap!.at + 24 * 60 * 60 * 1000 - now;
        if (!found) {
          return (
            <Card>
              <Text style={styles.body}>
                {name} got lost {Math.round(journeyProgress(message, now) * 100)}% of the way to {friendName(message.to)}!
              </Text>
              <JourneyPath progress={journeyProgress(message, now)} emoji={emoji} trouble />
              <Text style={styles.h2}>Search the bushes</Text>
              <SearchGame spots={9} hidden={emoji} cover="🌳" onFound={() => setFound(true)} />
              <Text style={styles.quiet}>If nobody searches, {name} will find its own way home in {formatDuration(giveUpIn)}.</Text>
            </Card>
          );
        }
        const editing = newText !== null;
        return (
          <Card>
            <Text style={styles.body}>
              You found {name}! 🎉 Send it on its way and you'll get an egg for the rescue.
            </Text>
            {editing ? (
              <>
                <Text style={styles.h2}>To</Text>
                <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
                  {world.friends.map((f) => (
                    <Pressable
                      key={f.id}
                      style={[styles.chip, (newTo ?? message.to) === f.id && styles.chipSelected]}
                      onPress={() => setNewTo(f.id)}
                    >
                      <Text style={{ color: colours.ink }}>
                        {f.emoji} {f.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
                  multiline
                  maxLength={280}
                  value={newText}
                  onChangeText={setNewText}
                />
                <Button
                  title="Send with the new message"
                  disabled={!newText.trim()}
                  onPress={() => {
                    dispatch({ type: 'redirect', messageId: message.id, newText: newText.trim(), newTo: newTo ?? undefined });
                    router.back();
                  }}
                />
              </>
            ) : (
              <>
                <Button
                  title={`Carry on to ${friendName(message.to)}`}
                  onPress={() => {
                    dispatch({ type: 'redirect', messageId: message.id });
                    router.back();
                  }}
                />
                <Button kind="secondary" title="Give it a new message" onPress={() => setNewText(message.text)} />
              </>
            )}
          </Card>
        );
      }
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {body()}
    </ScrollView>
  );
}
