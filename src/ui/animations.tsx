// Simple code-driven animations using React Native's built-in Animated API, so they run
// everywhere (phone and web) without extra libraries. Real drawn animation can replace these later.
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type TextStyle } from 'react-native';

const useNativeDriver = Platform.OS !== 'web';

export type Reaction = { kind: 'hop' | 'wiggle'; n: number };
export type Mood = 'happy' | 'tired';

/** A value that runs 0 → 1 → 0 forever. */
function useLoop(duration: number, enabled = true) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!enabled) {
      v.setValue(0);
      return;
    }
    const half = { duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver };
    const loop = Animated.loop(
      Animated.sequence([Animated.timing(v, { toValue: 1, ...half }), Animated.timing(v, { toValue: 0, ...half })]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, duration, enabled]);
  return v;
}

/**
 * An animal that gently bobs and breathes while idle (slower and droopier when tired),
 * and hops or wiggles each time `reaction.n` changes. A heart floats up with each reaction.
 */
export function AnimatedAnimal({
  emoji,
  size,
  mood = 'happy',
  reaction,
}: {
  emoji: string;
  size: number;
  mood?: Mood;
  reaction?: Reaction;
}) {
  const tired = mood === 'tired';
  const idle = useLoop(tired ? 3600 : 2000);
  const jump = useRef(new Animated.Value(0)).current;
  const turn = useRef(new Animated.Value(0)).current;
  const heart = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!reaction?.n) return;
    const t = (value: Animated.Value, toValue: number, duration: number) =>
      Animated.timing(value, { toValue, duration, easing: Easing.out(Easing.quad), useNativeDriver });
    const move =
      reaction.kind === 'hop'
        ? Animated.sequence([t(jump, 1, 160), t(jump, 0, 160), t(jump, 0.6, 130), t(jump, 0, 130)])
        : Animated.sequence([t(turn, -1, 90), t(turn, 1, 120), t(turn, -1, 120), t(turn, 1, 120), t(turn, 0, 90)]);
    heart.setValue(0);
    Animated.parallel([move, Animated.timing(heart, { toValue: 1, duration: 900, useNativeDriver })]).start();
  }, [reaction?.n]);

  const bob = idle.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (tired ? 0.02 : 0.06)] });
  const breathe = idle.interpolate({ inputRange: [0, 1], outputRange: [1, tired ? 1.01 : 1.05] });
  const hop = jump.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.35] });
  const rotate = turn.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] });
  const droop = tired ? '6deg' : '0deg';

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.Text
        style={{
          fontSize: size,
          transform: [{ translateY: Animated.add(bob, hop) }, { scale: breathe }, { rotate }, { rotateZ: droop }],
        }}
      >
        {emoji}
      </Animated.Text>
      {reaction?.n ? (
        <Animated.Text
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            fontSize: size * 0.4,
            opacity: heart.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
            transform: [{ translateY: heart.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.8] }) }],
          }}
        >
          {reaction.kind === 'hop' ? '😋' : '❤️'}
        </Animated.Text>
      ) : null}
    </View>
  );
}

/**
 * The animal on a delivery path: a little waddle while travelling, a nervous shake when in trouble.
 * Flipped so it faces the way it walks (most animal emojis face left).
 */
export function TravellingAnimal({
  emoji,
  trouble,
  walking = true,
  faceRight = true,
  style,
}: {
  emoji: string;
  trouble?: boolean;
  /** False stands still (no waddle). */
  walking?: boolean;
  faceRight?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  const step = useLoop(trouble ? 240 : 700, walking || !!trouble);
  const rotate = step.interpolate({ inputRange: [0, 1], outputRange: trouble ? ['0deg', '0deg'] : ['-10deg', '10deg'] });
  const shake = step.interpolate({ inputRange: [0, 1], outputRange: trouble ? [-3, 3] : [0, 0] });
  const bounce = step.interpolate({ inputRange: [0, 0.5, 1], outputRange: trouble ? [0, 0, 0] : [0, -3, 0] });
  return (
    <Animated.Text
      style={[
        style,
        { transform: [{ translateX: shake }, { translateY: bounce }, { rotate }, { scaleX: faceRight ? -1 : 1 }] },
      ]}
    >
      {emoji}
    </Animated.Text>
  );
}

/** Something that wobbles side to side, like an egg about to hatch. */
export function Wobble({ children, strength = 8 }: { children: ReactNode; strength?: number }) {
  const v = useLoop(900);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: [`-${strength}deg`, `${strength}deg`] });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}
