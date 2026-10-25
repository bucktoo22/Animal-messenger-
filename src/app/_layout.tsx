import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GameProvider } from '../state/GameProvider';
import { colours } from '../ui/components';

export default function RootLayout() {
  return (
    <GameProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colours.bg },
          headerTintColor: colours.ink,
          contentStyle: { backgroundColor: colours.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="animal/[id]" options={{ title: 'Your animal' }} />
        <Stack.Screen name="message/[id]" options={{ title: 'Message' }} />
        <Stack.Screen name="walk/[id]" options={{ title: 'Walk' }} />
        <Stack.Screen name="hatch/[id]" options={{ title: 'Hatch an egg', presentation: 'modal' }} />
      </Stack>
    </GameProvider>
  );
}
