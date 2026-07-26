import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { SuggestionCard } from '../components/SuggestionCard';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChipRow } from '../components/ChipRow';
import { color, font, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import {
  fetchActiveSuggestions,
  refreshSuggestions,
  applySuggestion,
  dismissSuggestion,
  snoozeSuggestion,
  Suggestion,
} from '../services/suggestionsService';

export function SuggestionsScreen() {
  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actingOnId, setActingOnId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setVenuesLoading(true);
      try {
        const data = await fetchMyVenues();
        setVenues(data);
        setSelectedVenueId((prev) => prev ?? data[0]?.id ?? null);
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, []);

  const load = useCallback(async (venueId: string) => {
    setLoading(true);
    setError(null);
    try {
      setSuggestions(await fetchActiveSuggestions(venueId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load suggestions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) load(selectedVenueId);
  }, [selectedVenueId, load]);

  const handleRefresh = async () => {
    if (!selectedVenueId) return;
    setRefreshing(true);
    try {
      const newCount = await refreshSuggestions(selectedVenueId);
      await load(selectedVenueId);
      if (newCount === 0) {
        Alert.alert('Up to date', 'No new patterns found since last refresh.');
      }
    } catch (e) {
      Alert.alert('Could not refresh', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleApply = async (s: Suggestion) => {
    setActingOnId(s.id);
    try {
      await applySuggestion(s);
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
      Alert.alert(
        s.hasAutomatedApply ? 'Applied' : 'Marked handled',
        s.hasAutomatedApply ? 'The new price is now live for this court.' : 'This suggestion has been marked as handled.'
      );
    } catch (e) {
      Alert.alert('Could not apply', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActingOnId(null);
    }
  };

  const handleDismiss = async (s: Suggestion) => {
    setActingOnId(s.id);
    try {
      await dismissSuggestion(s.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
    } catch (e) {
      Alert.alert('Could not dismiss', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActingOnId(null);
    }
  };

  const handleSnooze = async (s: Suggestion) => {
    setActingOnId(s.id);
    try {
      await snoozeSuggestion(s.id);
      setSuggestions((prev) => prev.filter((x) => x.id !== s.id));
      Alert.alert('Snoozed', "We'll bring this back up in 5 days if it's still relevant.");
    } catch (e) {
      Alert.alert('Could not snooze', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setActingOnId(null);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold title="Suggestions" subtitle={selectedVenue ? selectedVenue.name : `${suggestions.length} active recommendations`}>
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptySubtitle}>Add a venue on the Home tab first — suggestions are generated per venue.</Text>
        </Card>
      ) : (
        <>
          {venues.length > 1 && (
            <ChipRow
              chips={venues.map((v) => ({ key: v.id, label: v.name }))}
              selectedKey={selectedVenueId ?? venues[0].id}
              onSelect={setSelectedVenueId}
            />
          )}

          <Button label={refreshing ? 'Checking your data…' : 'Refresh suggestions'} variant="secondary" loading={refreshing} onPress={handleRefresh} />

          {loading ? (
            <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
          ) : error ? (
            <Card>
              <Text style={styles.errorText}>{error}</Text>
              <Button label="Retry" variant="secondary" size="sm" onPress={() => selectedVenueId && load(selectedVenueId)} style={{ marginTop: spacing.sm }} />
            </Card>
          ) : suggestions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>✅</Text>
              <Text style={styles.emptyTitle}>You're all caught up</Text>
              <Text style={styles.emptySubtitle}>
                No active suggestions right now. Tap "Refresh suggestions" any time to check your latest booking, pricing,
                stock, and membership data for new patterns.
              </Text>
            </View>
          ) : (
            suggestions.map((s) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                applying={actingOnId === s.id}
                onApply={() => handleApply(s)}
                onDismiss={() => handleDismiss(s)}
                onRemindLater={() => handleSnooze(s)}
              />
            ))
          )}
        </>
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
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});