import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { ChipRow } from '../components/ChipRow';
import { VenueCard } from '../components/VenueCard';
import { EventCard } from '../components/EventCard';
import { Button } from '../components/Button';
import { AddVenueModal } from '../components/AddVenueModal';
import { AddEventModal } from '../components/AddEventModal';
import { color, font, radius, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import { fetchMyEvents, EventRecord, EventStatus } from '../services/eventsService';

const EVENT_FILTERS: { key: EventStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'pending', label: 'Pending' },
  { key: 'past', label: 'Past' },
];

export function HomeScreen() {
  const [eventFilter, setEventFilter] = useState<EventStatus | 'all'>('all');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [addVenueVisible, setAddVenueVisible] = useState(false);

  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [addEventVisible, setAddEventVisible] = useState(false);

  const loadVenues = useCallback(async () => {
    setLoadingVenues(true);
    setVenuesError(null);
    try {
      const data = await fetchMyVenues();
      setVenues(data);
    } catch (e) {
      setVenuesError(e instanceof Error ? e.message : 'Could not load venues.');
    } finally {
      setLoadingVenues(false);
    }
  }, []);

  const loadEvents = useCallback(async () => {
    setLoadingEvents(true);
    setEventsError(null);
    try {
      const data = await fetchMyEvents();
      setEvents(data);
    } catch (e) {
      setEventsError(e instanceof Error ? e.message : 'Could not load events.');
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadVenues();
    loadEvents();
  }, [loadVenues, loadEvents]);

  const filteredEvents = useMemo(
    () => (eventFilter === 'all' ? events : events.filter((e) => e.status === eventFilter)),
    [eventFilter, events]
  );

  return (
    <ScreenScaffold title="Home" subtitle={`${venues.length} venues · ${events.length} events`}>
      {/* Venues -- live from Supabase */}
      <View>
        <SectionHeader title="Venues" onAddPress={() => setAddVenueVisible(true)} />

        {loadingVenues ? (
          <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
        ) : venuesError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{venuesError}</Text>
            <Button label="Retry" variant="secondary" size="sm" onPress={loadVenues} style={{ marginTop: spacing.sm }} />
          </View>
        ) : venues.length === 0 ? (
          <Text style={styles.emptyText}>No venues yet — tap + to add your first one.</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            {venues.map((v) => (
              <VenueCard
                key={v.id}
                venue={{
                  id: v.id,
                  name: v.name,
                  address: v.address,
                  sportsLabel: v.sports.join(', ') || 'No sports listed yet',
                  courtCount: v.courtCount,
                  status: v.isActive ? 'active' : 'inactive',
                }}
              />
            ))}
          </ScrollView>
        )}
      </View>

      {/* Events -- live from Supabase */}
      <View>
        <SectionHeader title="Events" onAddPress={() => setAddEventVisible(true)} />
        <ChipRow chips={EVENT_FILTERS} selectedKey={eventFilter} onSelect={(k) => setEventFilter(k as EventStatus | 'all')} />
        <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
          {loadingEvents ? (
            <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
          ) : eventsError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{eventsError}</Text>
              <Button label="Retry" variant="secondary" size="sm" onPress={loadEvents} style={{ marginTop: spacing.sm }} />
            </View>
          ) : filteredEvents.length === 0 ? (
            <Text style={styles.emptyText}>No {eventFilter === 'all' ? '' : eventFilter} events to show.</Text>
          ) : (
            filteredEvents.map((e) => <EventCard key={e.id} event={e} />)
          )}
        </View>
      </View>

      <AddVenueModal
        visible={addVenueVisible}
        onClose={() => setAddVenueVisible(false)}
        onCreated={(venue) => setVenues((prev) => [venue, ...prev])}
      />

      <AddEventModal
        visible={addEventVisible}
        venues={venues}
        onClose={() => setAddEventVisible(false)}
        onCreated={(event) => setEvents((prev) => [event, ...prev])}
      />
    </ScreenScaffold>
  );
}

function SectionHeader({ title, onAddPress }: { title: string; onAddPress: () => void }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={styles.sectionHeader}>{title}</Text>
      <Pressable onPress={onAddPress} style={styles.addButton} hitSlop={8}>
        <Text style={styles.addButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnLight },
  addButton: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: color.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: { fontFamily: font.sansBold, fontSize: 18, color: color.gold, lineHeight: 20 },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
  errorBox: { paddingVertical: spacing.md, alignItems: 'center' },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});