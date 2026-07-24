import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { color, font } from '../theme/tokens';

export function ComingSoonScreen({ label }: { label: string }) {
  return (
    <View style={styles.root}>
      <Text style={styles.emoji}>🛠️</Text>
      <Text style={styles.title}>{label}</Text>
      <Text style={styles.subtitle}>This screen is being built next in the sequence.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.background, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emoji: { fontSize: 32 },
  title: { fontFamily: font.serifSemiBold, fontSize: 20, color: color.textOnLight },
  subtitle: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center' },
});
