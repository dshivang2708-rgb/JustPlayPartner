import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ChipRow } from '../components/ChipRow';
import { SearchInput } from '../components/SearchInput';
import { CustomerRow } from '../components/CustomerRow';
import { color, font, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import { fetchCustomersForVenue, fetchCancellationLog, Customer, CancellationLogEntry } from '../services/crmService';

export function CustomerListScreen({ navigation }: { navigation: any }) {
  const [search, setSearch] = useState('');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cancellationLog, setCancellationLog] = useState<CancellationLogEntry[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

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

  const loadData = useCallback(async (venueId: string) => {
    setDataLoading(true);
    setDataError(null);
    try {
      const [customersData, logData] = await Promise.all([
        fetchCustomersForVenue(venueId),
        fetchCancellationLog(venueId),
      ]);
      setCustomers(customersData);
      setCancellationLog(logData);
    } catch (e) {
      setDataError(e instanceof Error ? e.message : 'Could not load customers.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) loadData(selectedVenueId);
  }, [selectedVenueId, loadData]);

  const filtered = useMemo(
    () =>
      customers.filter((c) => search.trim().length === 0 || c.name.toLowerCase().includes(search.toLowerCase())),
    [search, customers]
  );

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold title="Customers" subtitle={selectedVenue ? selectedVenue.name : `${customers.length} total customers`}>
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first — customers appear once bookings come in.</Text>
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

          <SearchInput value={search} onChangeText={setSearch} placeholder="Search by name" />

          {dataLoading ? (
            <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
          ) : dataError ? (
            <Card>
              <Text style={styles.errorText}>{dataError}</Text>
              <Button
                label="Retry"
                variant="secondary"
                size="sm"
                onPress={() => selectedVenueId && loadData(selectedVenueId)}
                style={{ marginTop: spacing.sm }}
              />
            </Card>
          ) : (
            <>
              <Card padded={false}>
                <View style={{ padding: spacing.md }}>
                  {filtered.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {customers.length === 0 ? 'No bookings yet at this venue.' : 'No customers match your search.'}
                    </Text>
                  ) : (
                    filtered.map((c) => (
                      <CustomerRow
                        key={c.phone}
                        customer={c}
                        onPress={() =>
                          navigation.navigate('CustomerDetail', {
                            venueId: selectedVenueId,
                            venueName: selectedVenue?.name,
                            phone: c.phone,
                            name: c.name,
                          })
                        }
                      />
                    ))
                  )}
                </View>
              </Card>

              <Text style={styles.sectionHeader}>Cancellation & reschedule log</Text>
              <Card padded={false}>
                <View style={{ padding: spacing.md }}>
                  {cancellationLog.length === 0 ? (
                    <Text style={styles.emptyText}>No cancellations or reschedules yet.</Text>
                  ) : (
                    cancellationLog.map((entry) => (
                      <View key={entry.id} style={styles.logRow}>
                        <View style={[styles.logTag, entry.type === 'cancelled' ? styles.logTagCancel : styles.logTagReschedule]}>
                          <Text style={[styles.logTagText, { color: entry.type === 'cancelled' ? color.danger : color.warning }]}>
                            {entry.type === 'cancelled' ? 'Cancelled' : 'Rescheduled'}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.logCustomer}>
                            {entry.customerName} · {entry.courtName}
                          </Text>
                          <Text style={styles.logMeta}>
                            {entry.dateLabel} · {entry.reason}
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </Card>
            </>
          )}
        </>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  logRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: color.border,
  },
  logTag: { paddingHorizontal: spacing.xs, paddingVertical: 3, borderRadius: 6, marginTop: 1 },
  logTagCancel: { backgroundColor: color.dangerBg },
  logTagReschedule: { backgroundColor: color.warningBg },
  logTagText: { fontFamily: font.sansSemiBold, fontSize: 10 },
  logCustomer: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.textOnLight },
  logMeta: { fontFamily: font.sans, fontSize: 11, color: color.textOnLightMuted, marginTop: 2 },
});