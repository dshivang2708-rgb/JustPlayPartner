import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { color, font, spacing } from '../theme/tokens';

export type MoreItem = {
  key: string;
  icon: string;
  label: string;
  description: string;
  route: string;
  status: 'ready' | 'coming-soon';
};

const ITEMS: MoreItem[] = [
  { key: 'profile', icon: '👤', label: 'Profile', description: 'Your account, business, and notification settings', route: 'Profile', status: 'ready' },
  { key: 'analytics', icon: '📊', label: 'Analytics', description: 'Peak hours, revenue trends, and repeat-rate', route: 'Analytics', status: 'ready' },
  { key: 'membership', icon: '🎟️', label: 'Memberships', description: 'Plans, pricing, and member renewals', route: 'Membership', status: 'ready' },
  { key: 'staff', icon: '👥', label: 'Staff management', description: 'Roles, permissions, and shift assignment', route: 'Staff', status: 'ready' },
  { key: 'equipment', icon: '🏸', label: 'Equipment rental', description: 'Inventory, stock, and rental pricing', route: 'Equipment', status: 'ready' },
  { key: 'reports', icon: '📄', label: 'Report center', description: 'Monthly, quarterly, and yearly reports', route: 'Reports', status: 'ready' },
  { key: 'suggestions', icon: '💡', label: 'Suggestions', description: 'AI-generated recommendations for your venue', route: 'Suggestions', status: 'ready' },
  { key: 'pricing', icon: '⚙️', label: 'Pricing rules', description: 'Min/max pricing and engine mode', route: 'Pricing', status: 'ready' },
  { key: 'camera', icon: '📷', label: 'Camera & occupancy', description: 'Live snapshots and discrepancy alerts', route: 'Camera', status: 'ready' },
  { key: 'marketing', icon: '📣', label: 'Marketing tools', description: 'Coupons, microsite, and broadcasts', route: 'Marketing', status: 'ready' },
  { key: 'crm', icon: '🧾', label: 'Customer relationship', description: 'Customer history, notes, and reschedules', route: 'CRM', status: 'ready' },
  { key: 'automation', icon: '🔁', label: 'Automation settings', description: 'Report cadence and notification channels', route: 'Automation', status: 'ready' },
];

export function MoreHubScreen({ navigation }: { navigation: any }) {
  return (
    <ScreenScaffold title="More" subtitle="Every part of your venue, in one place">
      {ITEMS.map((item) => (
        <Pressable
          key={item.key}
          disabled={item.status === 'coming-soon'}
          onPress={() => navigation.navigate(item.route)}
        >
          <Card style={styles.row}>
            <Text style={styles.icon}>{item.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            {item.status === 'coming-soon' ? (
              <Text style={styles.soonBadge}>Soon</Text>
            ) : (
              <Text style={styles.chevron}>›</Text>
            )}
          </Card>
        </Pressable>
      ))}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  icon: { fontSize: 22, width: 30 },
  label: { fontFamily: font.sansSemiBold, fontSize: 15, color: color.textOnLight },
  description: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  chevron: { fontFamily: font.sansSemiBold, fontSize: 20, color: color.textOnLightFaint },
  soonBadge: {
    fontFamily: font.sansMedium,
    fontSize: 11,
    color: color.textOnLightMuted,
    backgroundColor: color.background,
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: 999,
  },
});