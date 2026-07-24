import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { SearchInput } from '../components/SearchInput';
import { CustomerRow } from '../components/CustomerRow';
import { color, font, spacing } from '../theme/tokens';
import { customers, cancellationLog } from '../data/crmData';

export function CustomerListScreen({ navigation }: { navigation: any }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) => search.trim().length === 0 || c.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search]
  );

  return (
    <ScreenScaffold title="Customers" subtitle={`${customers.length} total customers`}>
      <SearchInput value={search} onChangeText={setSearch} placeholder="Search by name" />

      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No customers match your search.</Text>
          ) : (
            filtered.map((c) => (
              <CustomerRow key={c.id} customer={c} onPress={() => navigation.navigate('CustomerDetail', { customerId: c.id })} />
            ))
          )}
        </View>
      </Card>

      <Text style={styles.sectionHeader}>Cancellation & reschedule log</Text>
      <Card padded={false}>
        <View style={{ padding: spacing.md }}>
          {cancellationLog.map((entry) => (
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
          ))}
        </View>
      </Card>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
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