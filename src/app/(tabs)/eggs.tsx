import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { DELIVERIES_PER_EGG } from '../../game/rules';
import { useGame } from '../../state/GameProvider';
import { Card, styles } from '../../ui/components';

export default function EggsScreen() {
  const { world } = useGame();
  const toNext = DELIVERIES_PER_EGG - (world.cleanDeliveries % DELIVERIES_PER_EGG);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.quiet}>
        Earn eggs by making deliveries ({toNext} more until the next one) and by rescuing lost animals. Most eggs hatch
        common animals, but some hatch rare ones.
      </Text>
      {world.eggs.length === 0 && <Text style={styles.body}>No eggs right now.</Text>}
      <View style={[styles.row, { flexWrap: 'wrap' }]}>
        {world.eggs.map((egg) => (
          <Link key={egg.id} href={`/hatch/${egg.id}`} asChild>
            <Pressable>
              <Card style={{ alignItems: 'center', width: 140 }}>
                <Text style={{ fontSize: 52 }}>🥚</Text>
                <Text style={styles.h2}>Mystery egg</Text>
                <Text style={styles.quiet}>Tap to hatch</Text>
              </Card>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}
