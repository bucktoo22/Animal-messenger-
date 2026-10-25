import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { HOUR, MINUTE } from '../game/rules';
import { ANIMAL_COLOURS, SPECIES } from '../game/species';
import { MAX_TRAITS, TRAITS, TRAIT_LIST, clashes } from '../game/traits';
import type { Animal, TraitId } from '../game/types';

export const colours = {
  bg: '#FFF8EE',
  card: '#FFFFFF',
  ink: '#2B2118',
  quiet: '#7A6A5C',
  line: '#EADBC8',
  accent: '#E07A3F',
  good: '#5A9E5A',
  warn: '#E0A33F',
  bad: '#C8553D',
};

export function formatDuration(ms: number): string {
  if (ms <= 0) return 'now';
  if (ms < MINUTE) return `${Math.ceil(ms / 1000)}s`;
  if (ms < HOUR) return `${Math.round(ms / MINUTE)} min`;
  const h = Math.floor(ms / HOUR);
  const m = Math.round((ms % HOUR) / MINUTE);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function AnimalAvatar({ animal, size = 56 }: { animal: Pick<Animal, 'speciesId' | 'colour'>; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: animal.colour,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.55 }}>{SPECIES[animal.speciesId].emoji}</Text>
    </View>
  );
}

export function Meter({ label, value }: { label: string; value: number }) {
  const colour = value < 30 ? colours.bad : value < 60 ? colours.warn : colours.good;
  return (
    <View style={styles.meterRow}>
      <Text style={styles.meterLabel}>{label}</Text>
      <View style={styles.meterTrack}>
        <View style={[styles.meterFill, { width: `${Math.round(value)}%`, backgroundColor: colour }]} />
      </View>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  disabled,
  kind = 'primary',
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  kind?: 'primary' | 'secondary';
}) {
  const primary = kind === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        primary ? styles.buttonPrimary : styles.buttonSecondary,
        disabled && { opacity: 0.4 },
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.buttonText, { color: primary ? '#fff' : colours.accent }]}>{title}</Text>
    </Pressable>
  );
}

/** A path from sender to recipient with the animal drawn at its current position. */
export function JourneyPath({ progress, emoji, trouble }: { progress: number; emoji: string; trouble?: boolean }) {
  return (
    <View style={styles.path}>
      <View style={styles.pathLine} />
      <View style={[styles.pathDone, { width: `${progress * 100}%` }]} />
      <Text style={[styles.pathAnimal, { left: `${progress * 100}%` }]}>
        {emoji}
        {trouble ? '❓' : ''}
      </Text>
      <Text style={[styles.pathEnd, { right: -4 }]}>🏠</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colours.bg },
  content: { padding: 16, gap: 12 },
  h1: { fontSize: 22, fontWeight: '700', color: colours.ink },
  h2: { fontSize: 17, fontWeight: '600', color: colours.ink },
  body: { fontSize: 15, color: colours.ink, lineHeight: 21 },
  quiet: { fontSize: 13, color: colours.quiet },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  card: {
    backgroundColor: colours.card,
    borderRadius: 16,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colours.line,
  },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meterLabel: { width: 72, fontSize: 12, color: colours.quiet },
  meterTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colours.line, overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: 4 },
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center' },
  buttonPrimary: { backgroundColor: colours.accent },
  buttonSecondary: { backgroundColor: '#FBE6D7' },
  buttonText: { fontSize: 15, fontWeight: '600' },
  input: {
    backgroundColor: colours.card,
    borderWidth: 1,
    borderColor: colours.line,
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    color: colours.ink,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colours.line,
    backgroundColor: colours.card,
  },
  chipSelected: { borderColor: colours.accent, backgroundColor: '#FBE6D7' },
  path: { height: 32, justifyContent: 'center', marginHorizontal: 12, marginVertical: 4 },
  pathLine: { position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2, backgroundColor: colours.line },
  pathDone: { position: 'absolute', left: 0, height: 3, borderRadius: 2, backgroundColor: colours.accent },
  pathAnimal: { position: 'absolute', fontSize: 22, marginLeft: -12 },
  pathEnd: { position: 'absolute', fontSize: 18 },
});

export function ColourPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View style={[styles.row, { flexWrap: 'wrap' }]}>
      {ANIMAL_COLOURS.map((c) => (
        <Pressable
          key={c}
          accessibilityLabel={`Colour ${c}`}
          onPress={() => onChange(c)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: c,
            borderWidth: 3,
            borderColor: c === value ? colours.ink : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

/** Choose up to two traits. Traits that clash with a chosen one are greyed out. */
export function TraitPicker({ value, onChange }: { value: TraitId[]; onChange: (t: TraitId[]) => void }) {
  return (
    <View style={{ gap: 8 }}>
      {TRAIT_LIST.map((t) => {
        const selected = value.includes(t.id);
        const blocked = !selected && (value.length >= MAX_TRAITS || value.some((v) => clashes(v, t.id)));
        return (
          <Pressable
            key={t.id}
            disabled={blocked}
            onPress={() => onChange(selected ? value.filter((v) => v !== t.id) : [...value, t.id])}
            style={[styles.chip, { borderRadius: 12 }, selected && styles.chipSelected, blocked && { opacity: 0.4 }]}
          >
            <Text style={{ color: colours.ink, fontWeight: '600' }}>
              {t.emoji} {t.name}
            </Text>
            <Text style={styles.quiet}>{t.description}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function traitLabel(traits: TraitId[] | undefined): string {
  return (traits ?? []).map((t) => `${TRAITS[t].emoji} ${TRAITS[t].name}`).join('  ');
}
