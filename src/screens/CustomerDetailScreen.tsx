import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge, StatusTone } from '../components/StatusBadge';
import { color, font, radius, spacing } from '../theme/tokens';
import {
  fetchCustomerBookingHistory,
  fetchCustomerNote,
  saveCustomerNote,
  BookingHistoryEntry,
} from '../services/crmService';

const STATUS_TONE: Record<BookingHistoryEntry['status'], StatusTone> = {
  completed: 'success',
  cancelled: 'danger',
  confirmed: 'info',
};

const STATUS_LABEL: Record<BookingHistoryEntry['status'], string> = {
  completed: 'Completed',
  cancelled: 'Cancelled',
  confirmed: 'Confirmed',
};

export function CustomerDetailScreen({ route }: { route: any }) {
  const { venueId, venueName, phone, name } = route.params;

  const [history, setHistory] = useState<BookingHistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchCustomerBookingHistory(venueId, phone);
      setHistory(data);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : 'Could not load booking history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [venueId, phone]);

  useEffect(() => {
    loadHistory();
    (async () => {
      setNoteLoading(true);
      try {
        setNote(await fetchCustomerNote(venueId, phone));
      } finally {
        setNoteLoading(false);
      }
    })();
  }, [venueId, phone, loadHistory]);

  const totalBookings = history.length;
  const totalSpend = history
    .filter((h) => h.status === 'completed')
    .reduce((sum, h) => sum + Number(h.amountLabel.replace(/[^0-9.]/g, '')), 0);
  const lastVisit = history[0]?.dateLabel ?? '—';

  const handleSaveNote = async () => {
    setSavingNote(true);
    setNoteSaved(false);
    try {
      await saveCustomerNote(venueId, phone, note);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <ScreenScaffold title={name} subtitle={`${phone} · ${venueName}`}>
      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <Stat label="Bookings" value={String(totalBookings)} />
          <Stat label="Total spend" value={`₹${totalSpend.toLocaleString('en-IN')}`} />
          <Stat label="Last visit" value={lastVisit} />
        </View>
      </Card>

      {/* Notes -- editable, saved per venue */}
      <Card>
        <Text style={styles.sectionHeader}>Notes</Text>
        {noteLoading ? (
          <ActivityIndicator color={color.gold} />
        ) : (
          <>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Add notes about this customer's preferences, history, or anything staff should know…"
              placeholderTextColor={color.textOnLightFaint}
              multiline
              style={styles.noteInput}
            />
            <View style={styles.noteActionsRow}>
              {noteSaved && <Text style={styles.noteSavedText}>Saved</Text>}
              <Button label="Save note" variant="secondary" size="sm" loading={savingNote} onPress={handleSaveNote} />
            </View>
          </>
        )}
      </Card>

      {/* Booking history */}
      <View>
        <Text style={styles.sectionHeader}>Booking history</Text>
        <Card padded={false}>
          <View style={{ padding: spacing.md }}>
            {historyLoading ? (
              <ActivityIndicator color={color.gold} />
            ) : historyError ? (
              <>
                <Text style={styles.errorText}>{historyError}</Text>
                <Button label="Retry" variant="secondary" size="sm" onPress={loadHistory} style={{ marginTop: spacing.sm }} />
              </>
            ) : history.length === 0 ? (
              <Text style={styles.emptyText}>No bookings yet.</Text>
            ) : (
              history.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyCourt}>{h.courtName}</Text>
                    <Text style={styles.historyDate}>
                      {h.dateLabel}
                      {h.wasRescheduled ? ' · Rescheduled to a new slot' : ''}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>{h.amountLabel}</Text>
                  <StatusBadge
                    label={h.wasRescheduled ? 'Rescheduled' : STATUS_LABEL[h.status]}
                    tone={h.wasRescheduled ? 'warning' : STATUS_TONE[h.status]}
                  />
                </View>
              ))
            )}
          </View>
        </Card>
      </View>
    </ScreenScaffold>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statValue: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnLight },
  statLabel: { fontFamily: font.sansMedium, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },

  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight, marginBottom: spacing.sm },
  noteInput: {
    backgroundColor: color.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textOnLight,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  noteActionsRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  noteSavedText: { fontFamily: font.sansMedium, fontSize: 12, color: color.success },

  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.sm },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  historyCourt: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  historyDate: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
  historyAmount: { fontFamily: font.serifSemiBold, fontSize: 14, color: color.textOnLight },
});