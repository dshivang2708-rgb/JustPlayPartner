import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { StatusBadge, StatusTone } from '../components/StatusBadge';
import { color, font, spacing } from '../theme/tokens';
import { customers, bookingHistoryByCustomer, BookingHistoryEntry } from '../data/crmData';

const STATUS_TONE: Record<BookingHistoryEntry['status'], StatusTone> = {
  completed: 'success',
  cancelled: 'danger',
  rescheduled: 'warning',
};

export function CustomerDetailScreen({ route }: { route: any }) {
  const { customerId } = route.params;
  const customer = customers.find((c) => c.id === customerId) ?? customers[0];
  const history = bookingHistoryByCustomer[customer.id] ?? [];

  return (
    <ScreenScaffold title={customer.name} subtitle={customer.phone}>
      {/* Stats */}
      <Card>
        <View style={styles.statsRow}>
          <Stat label="Bookings" value={String(customer.totalBookings)} />
          <Stat label="Total spend" value={customer.totalSpendLabel} />
          <Stat label="Last visit" value={customer.lastVisitLabel} />
        </View>
      </Card>

      {/* Preferences */}
      <Card>
        <Text style={styles.sectionHeader}>Preferences</Text>
        <View style={styles.prefRow}>
          <Text style={styles.prefLabel}>Preferred sport</Text>
          <Text style={styles.prefValue}>{customer.preferredSport}</Text>
        </View>
      </Card>

      {/* Notes */}
      <Card>
        <Text style={styles.sectionHeader}>Notes</Text>
        <Text style={styles.notes}>
          {customer.notes || 'No notes recorded for this customer yet.'}
        </Text>
      </Card>

      {/* Booking history */}
      <View>
        <Text style={styles.sectionHeader}>Booking history</Text>
        <Card padded={false}>
          <View style={{ padding: spacing.md }}>
            {history.length === 0 ? (
              <Text style={styles.emptyText}>No bookings yet.</Text>
            ) : (
              history.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.historyCourt}>{h.courtName}</Text>
                    <Text style={styles.historyDate}>{h.dateLabel}</Text>
                  </View>
                  <Text style={styles.historyAmount}>{h.amountLabel}</Text>
                  <StatusBadge
                    label={h.status === 'completed' ? 'Completed' : h.status === 'cancelled' ? 'Cancelled' : 'Rescheduled'}
                    tone={STATUS_TONE[h.status]}
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
  prefRow: { flexDirection: 'row', justifyContent: 'space-between' },
  prefLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLightMuted },
  prefValue: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  notes: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, lineHeight: 19 },

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