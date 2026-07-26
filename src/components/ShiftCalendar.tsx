import React from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { StaffMember, ShiftCode, WEEK_DAYS } from '../services/staffService';

type Props = {
  staff: StaffMember[]; // active members only -- pending invites have no shifts yet
  shifts: Record<string, ShiftCode[]>;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onCellPress: (staffId: string, dayIndex: number, currentCode: ShiftCode) => void;
  savingCell: string | null; // `${staffId}:${dayIndex}` while a save is in flight, for a tiny inline spinner
};

const NEXT_SHIFT: Record<ShiftCode, ShiftCode> = { M: 'E', E: 'O', O: 'M' };

export function ShiftCalendar({ staff, shifts, loading, error, onRetry, onCellPress, savingCell }: Props) {
  if (loading) {
    return (
      <Card>
        <ActivityIndicator color={color.gold} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text style={styles.errorText}>{error}</Text>
        <Button label="Retry" variant="secondary" size="sm" onPress={onRetry} style={{ marginTop: spacing.sm }} />
      </Card>
    );
  }

  if (staff.length === 0) {
    return (
      <Card>
        <Text style={styles.emptyText}>Add staff to this venue to start scheduling shifts.</Text>
      </Card>
    );
  }

  return (
    <Card padded={false}>
      <View style={{ padding: spacing.md }}>
        <Text style={styles.hint}>Tap a cell to cycle Morning → Evening → Off.</Text>

        <View style={styles.calRow}>
          <Text style={[styles.calCell, styles.calNameHeader]}>Staff</Text>
          {WEEK_DAYS.map((d) => (
            <Text key={d} style={[styles.calCell, styles.calDayHeader]}>
              {d}
            </Text>
          ))}
        </View>

        {staff.map((m) => {
          const row = shifts[m.id] ?? ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
          return (
            <View key={m.id} style={styles.calRow}>
              <Text style={[styles.calCell, styles.calName]} numberOfLines={1}>
                {m.name.split(' ')[0]}
              </Text>
              {row.map((shift, i) => (
                <ShiftCell
                  key={i}
                  shift={shift}
                  saving={savingCell === `${m.id}:${i}`}
                  onPress={() => onCellPress(m.id, i, shift)}
                />
              ))}
            </View>
          );
        })}

        <View style={styles.legendRow}>
          <LegendDot color={color.info} label="Morning" code="M" />
          <LegendDot color={color.gold} label="Evening" code="E" />
          <LegendDot color={color.textOnLightFaint} label="Off" code="O" />
        </View>
      </View>
    </Card>
  );
}

function ShiftCell({ shift, saving, onPress }: { shift: ShiftCode; saving: boolean; onPress: () => void }) {
  const bg = shift === 'M' ? color.infoBg : shift === 'E' ? color.goldMuted : color.background;
  const fg = shift === 'M' ? color.info : shift === 'E' ? '#8A6A2E' : color.textOnLightFaint;
  return (
    <Pressable onPress={onPress} disabled={saving} style={[styles.calCell, styles.shiftPill, { backgroundColor: bg }]}>
      {saving ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <Text style={[styles.shiftPillText, { color: fg }]}>{shift}</Text>
      )}
    </Pressable>
  );
}

function LegendDot({ color: dotColor, label, code }: { color: string; label: string; code: ShiftCode }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: dotColor }]} />
      <Text style={styles.legendLabel}>
        {label} ({code})
      </Text>
    </View>
  );
}

export { NEXT_SHIFT };

const styles = StyleSheet.create({
  hint: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginBottom: spacing.sm },
  calRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  calCell: { flex: 1, textAlign: 'center', alignItems: 'center', justifyContent: 'center' },
  calNameHeader: { flex: 1.2, textAlign: 'left', fontFamily: font.sansSemiBold, fontSize: 11, letterSpacing: 0.6, color: color.textOnLightFaint },
  calDayHeader: { fontFamily: font.sansSemiBold, fontSize: 11, letterSpacing: 0.6, color: color.textOnLightFaint },
  calName: { flex: 1.2, textAlign: 'left', fontFamily: font.sansSemiBold, fontSize: 12, color: color.textOnLight },
  shiftPill: { borderRadius: radius.sm, paddingVertical: 6, marginHorizontal: 1 },
  shiftPillText: { fontFamily: font.sansSemiBold, fontSize: 11, textAlign: 'center' },

  legendRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: color.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontFamily: font.sansMedium, fontSize: 12, color: color.textOnLightMuted },

  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
});