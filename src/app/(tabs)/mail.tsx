import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { journeyProgress } from '../../game/rules';
import { SPECIES } from '../../game/species';
import type { Message } from '../../game/types';
import { useGame } from '../../state/GameProvider';
import { Card, JourneyPath, colours, formatDuration, styles } from '../../ui/components';

const TROUBLE: Record<string, string> = {
  lost: 'got lost! Tap to search for it.',
  dropped: 'dropped your message on the way. Tap to pick it up.',
  returned: 'gave up and came home. Tap to send again.',
};

export default function MailScreen() {
  const { world, now } = useGame();
  const friendName = (id: string) => world.friends.find((f) => f.id === id)?.name ?? 'Someone';
  const animalOf = (m: Message) => world.animals.find((a) => a.id === m.animalId);
  const newestFirst = (a: Message, b: Message) => b.sentAt - a.sentAt;

  const trouble = world.messages.filter((m) => !m.incoming && m.status in TROUBLE).sort(newestFirst);
  const onTheWay = world.messages.filter((m) => m.status === 'travelling').sort(newestFirst);
  const inbox = world.messages.filter((m) => m.incoming && m.status === 'delivered').sort((a, b) => b.arriveAt - a.arriveAt);
  const sent = world.messages.filter((m) => !m.incoming && m.status === 'delivered').sort((a, b) => b.arriveAt - a.arriveAt);

  const row = (m: Message, children: ReactNode, highlight?: string) => (
    <Link key={m.id} href={`/message/${m.id}`} asChild>
      <Pressable>
        <Card style={highlight ? { borderColor: highlight, borderWidth: 2 } : undefined}>{children}</Card>
      </Pressable>
    </Link>
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {trouble.length > 0 && <Text style={styles.h2}>Needs you</Text>}
      {trouble.map((m) => {
        const a = animalOf(m);
        return row(
          m,
          <Text style={styles.body}>
            {a ? `${SPECIES[a.speciesId].emoji} ${a.name}` : 'Your animal'} {TROUBLE[m.status]}
          </Text>,
          colours.warn,
        );
      })}

      <Text style={styles.h2}>On the way</Text>
      {onTheWay.length === 0 && <Text style={styles.quiet}>Nothing travelling right now.</Text>}
      {onTheWay.map((m) => {
        if (m.incoming) {
          return row(
            m,
            <>
              <Text style={styles.body}>Something is on its way from {friendName(m.from)}...</Text>
              <JourneyPath progress={journeyProgress(m, now)} emoji={SPECIES[m.carrier ?? 'pigeon'].emoji} />
              <Text style={styles.quiet}>Arrives in {formatDuration(m.arriveAt - now)}</Text>
            </>,
          );
        }
        const a = animalOf(m);
        return row(
          m,
          <>
            <Text style={styles.body}>
              {a?.name ?? 'Your animal'} is taking your message to {friendName(m.to)}
            </Text>
            <JourneyPath progress={journeyProgress(m, now)} emoji={a ? SPECIES[a.speciesId].emoji : '🐾'} />
            <Text style={styles.quiet}>Arrives in about {formatDuration(m.arriveAt - now)}</Text>
          </>,
        );
      })}

      <Text style={styles.h2}>Inbox</Text>
      {inbox.length === 0 && <Text style={styles.quiet}>No messages yet.</Text>}
      {inbox.map((m) =>
        row(
          m,
          <View style={styles.row}>
            <Text style={{ fontSize: 24 }}>{m.read ? '📭' : '📬'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.h2, !m.read && { color: colours.accent }]}>From {friendName(m.from)}</Text>
              <Text style={styles.quiet} numberOfLines={1}>
                {m.read ? m.text : `Delivered by ${SPECIES[m.carrier ?? 'pigeon'].name.toLowerCase()}. Tap to open.`}
              </Text>
            </View>
          </View>,
        ),
      )}

      {sent.length > 0 && <Text style={styles.h2}>Delivered</Text>}
      {sent.map((m) =>
        row(
          m,
          <Text style={styles.quiet} numberOfLines={1}>
            ✅ To {friendName(m.to)}: {m.text}
          </Text>,
        ),
      )}
    </ScrollView>
  );
}
