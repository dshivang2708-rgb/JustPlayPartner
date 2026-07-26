import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { Suggestion } from '../services/suggestionsService';

type Props = {
  suggestion: Suggestion;
  onApply: () => void;
  onDismiss: () => void;
  onRemindLater: () => void;
  applying?: boolean;
};

export function SuggestionCard({ suggestion, onApply, onDismiss, onRemindLater, applying }: Props) {
  const [showWhy, setShowWhy] = useState(false);

  return (
    <Card>
      <Text style={styles.title}>{suggestion.title}</Text>
      <Text style={styles.detail}>{suggestion.detail}</Text>

      <View style={styles.impactRow}>
        <Text style={styles.impactLabel}>EXPECTED IMPACT</Text>
        <Text style={styles.impactValue}>{suggestion.expectedImpactLabel}</Text>
      </View>

      <Pressable onPress={() => setShowWhy((v) => !v)} style={styles.whyToggle}>
        <Text style={styles.whyToggleText}>{showWhy ? 'Hide why' : 'Why this suggestion?'}</Text>
        <Text style={styles.whyToggleChevron}>{showWhy ? '▲' : '▼'}</Text>
      </Pressable>

      {showWhy && (
        <View style={styles.whyTrail}>
          {suggestion.whyTrail.map((point, i) => (
            <View key={i} style={styles.whyRow}>
              <View style={styles.whyDot} />
              <Text style={styles.whyText}>{point}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.actionsRow}>
        <Button
          label={suggestion.hasAutomatedApply ? 'Apply' : 'Mark handled'}
          variant="primary"
          size="sm"
          onPress={onApply}
          loading={applying}
          style={{ flex: 1 }}
          fullWidth
        />
        <Button label="Remind later" variant="secondary" size="sm" onPress={onRemindLater} disabled={applying} style={{ flex: 1 }} fullWidth />
        <Button label="Dismiss" variant="ghost" size="sm" onPress={onDismiss} disabled={applying} style={{ flex: 1 }} fullWidth />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: font.serifSemiBold, fontSize: 16, color: color.textOnLight, lineHeight: 21 },
  detail: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, marginTop: 6, lineHeight: 19 },

  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: color.goldMuted,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  impactLabel: { fontFamily: font.sansSemiBold, fontSize: 10, letterSpacing: 0.5, color: '#8A6A2E' },
  impactValue: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.gold },

  whyToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  whyToggleText: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLightMuted },
  whyToggleChevron: { fontSize: 10, color: color.textOnLightFaint },

  whyTrail: {
    backgroundColor: color.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    gap: 8,
    marginBottom: spacing.sm,
  },
  whyRow: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  whyDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: color.textOnLightFaint, marginTop: 6 },
  whyText: { flex: 1, fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, lineHeight: 17 },

  actionsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
});