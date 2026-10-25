import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useGame } from '../../state/GameProvider';
import { colours } from '../../ui/components';

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function TabsLayout() {
  const { world } = useGame();
  const unread = world.messages.filter((m) => m.incoming && m.status === 'delivered' && !m.read).length;
  const trouble = world.messages.filter((m) => !m.incoming && (m.status === 'lost' || m.status === 'dropped' || m.status === 'returned')).length;
  const mailBadge = unread + trouble || undefined;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colours.bg },
        headerTintColor: colours.ink,
        tabBarActiveTintColor: colours.accent,
        tabBarStyle: { backgroundColor: colours.bg },
        sceneStyle: { backgroundColor: colours.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Animals', tabBarIcon: icon('🐾') }} />
      <Tabs.Screen name="send" options={{ title: 'Send', tabBarIcon: icon('✉️') }} />
      <Tabs.Screen name="mail" options={{ title: 'Mail', tabBarIcon: icon('📬'), tabBarBadge: mailBadge }} />
      <Tabs.Screen
        name="eggs"
        options={{ title: 'Eggs', tabBarIcon: icon('🥚'), tabBarBadge: world.eggs.length || undefined }}
      />
    </Tabs>
  );
}
