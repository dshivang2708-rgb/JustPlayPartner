import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SuggestionCard } from '../components/SuggestionCard';
import { color, font, spacing } from '../theme/tokens';
import { initialSuggestions, Suggestion, SuggestionStatus } from '../data/suggestionsData';

export function SuggestionsScreen() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>(initialSuggestions);

  const setStatus = (id: string, status: SuggestionStatus) => {
    setSuggestions((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));
  };

  const active = suggestions.filter((s) => s.status === 'active');
  const resolvedCount = suggestions.length - active.length;

  return (
    <ScreenScaffold
      title="Suggestions"
      subtitle={`${active.length} active recommendation${active.length === 1 ? '' : 's'}`}
    >
      {active.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>✅</Text>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptySubtitle}>
            {resolvedCount > 0
              ? `You've acted on all ${resolvedCount} recent suggestions. New ones show up here as fresh patterns appear in your data.`
              : 'New suggestions show up here as patterns appear in your booking, pricing, and membership data.'}
          </Text>
        </View>
      ) : (
        active.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            onApply={() => {
              setStatus(s.id, 'applied');
              Alert.alert('Applied', 'This suggestion has been applied to your venue settings.');
            }}
            onDismiss={() => setStatus(s.id, 'dismissed')}
            onRemindLater={() => {
              setStatus(s.id, 'snoozed');
              Alert.alert('Snoozed', "We'll bring this back up in a few days.");
            }}
          />
        ))
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxxl, gap: 8 },
  emptyEmoji: { fontSize: 32 },
  emptyTitle: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnLight },
  emptySubtitle: {
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textOnLightMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    lineHeight: 19,
  },
});