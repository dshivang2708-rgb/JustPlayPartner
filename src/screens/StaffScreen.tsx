import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { SegmentedControl } from '../components/SegmentedControl';
import { ChipRow } from '../components/ChipRow';
import { StaffRow } from '../components/StaffRow';
import { InviteStaffForm } from '../components/InviteStaffForm';
import { EditStaffModal } from '../components/EditStaffModal';
import { ShiftCalendar } from '../components/ShiftCalendar';
import { color, font, spacing } from '../theme/tokens';
import { fetchMyVenues, VenueRecord } from '../services/venuesService';
import {
  fetchStaffForVenue,
  removeStaffMember,
  cancelInvitation,
  fetchShiftsForVenue,
  setShift,
  StaffMember,
  ShiftCode,
} from '../services/staffService';
import { supabase } from '../lib/supabase';

const MODES = [
  { key: 'list', label: 'Staff list' },
  { key: 'add', label: 'Add staff' },
  { key: 'shifts', label: 'Shift calendar' },
];

export function StaffScreen() {
  const [mode, setMode] = useState('list');

  const [venues, setVenues] = useState<VenueRecord[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState<string | null>(null);

  const [shifts, setShifts] = useState<Record<string, ShiftCode[]>>({});
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [savingCell, setSavingCell] = useState<string | null>(null);

  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    (async () => {
      setVenuesLoading(true);
      try {
        const data = await fetchMyVenues();
        setVenues(data);
        setSelectedVenueId((prev) => prev ?? data[0]?.id ?? null);
      } catch {
        // Venues section on Home already surfaces load errors -- here we
        // just fall through to the "add a venue first" empty state below.
      } finally {
        setVenuesLoading(false);
      }
    })();
  }, []);

  const loadStaff = useCallback(async (venueId: string) => {
    setStaffLoading(true);
    setStaffError(null);
    try {
      const data = await fetchStaffForVenue(venueId);
      setStaff(data);
    } catch (e) {
      setStaffError(e instanceof Error ? e.message : 'Could not load staff.');
    } finally {
      setStaffLoading(false);
    }
  }, []);

  const loadShifts = useCallback(async (venueId: string) => {
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const data = await fetchShiftsForVenue(venueId);
      setShifts(data);
    } catch (e) {
      setShiftsError(e instanceof Error ? e.message : 'Could not load the shift calendar.');
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedVenueId) {
      loadStaff(selectedVenueId);
      loadShifts(selectedVenueId);
    }
  }, [selectedVenueId, loadStaff, loadShifts]);

  const activeStaff = useMemo(() => staff.filter((m) => m.kind === 'active'), [staff]);

  const handleRemove = (member: StaffMember) => {
    const isPending = member.kind === 'pending';
    Alert.alert(
      isPending ? 'Cancel invitation?' : 'Remove staff member?',
      isPending
        ? `This cancels the pending invitation for ${member.name}.`
        : `${member.name} will lose access to this venue immediately.`,
      [
        { text: 'Back', style: 'cancel' },
        {
          text: isPending ? 'Cancel invitation' : 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isPending) await cancelInvitation(member.id);
              else await removeStaffMember(member.id);
              setStaff((prev) => prev.filter((m) => m.id !== member.id));
            } catch (e) {
              Alert.alert('Something went wrong', e instanceof Error ? e.message : 'Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShiftCellPress = async (staffId: string, dayIndex: number, currentCode: ShiftCode) => {
    if (!selectedVenueId) return;
    const nextCode: ShiftCode = currentCode === 'M' ? 'E' : currentCode === 'E' ? 'O' : 'M';
    const cellKey = `${staffId}:${dayIndex}`;

    // Optimistic update -- revert on failure.
    const previous = shifts[staffId] ?? ['O', 'O', 'O', 'O', 'O', 'O', 'O'];
    setShifts((prev) => ({
      ...prev,
      [staffId]: previous.map((c, i) => (i === dayIndex ? nextCode : c)),
    }));
    setSavingCell(cellKey);

    try {
      await setShift({ venueId: selectedVenueId, staffId, dayOfWeek: dayIndex, shiftCode: nextCode });
    } catch (e) {
      setShifts((prev) => ({ ...prev, [staffId]: previous }));
      Alert.alert('Could not save shift', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSavingCell(null);
    }
  };

  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  return (
    <ScreenScaffold title="Staff" subtitle={selectedVenue ? selectedVenue.name : `${venues.length} venues`}>
      {venuesLoading ? (
        <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
      ) : venues.length === 0 ? (
        <Card>
          <Text style={styles.emptyText}>Add a venue on the Home tab first — staff are managed per venue.</Text>
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

          <SegmentedControl options={MODES} selectedKey={mode} onChange={setMode} />

          {mode === 'list' &&
            (staffLoading ? (
              <ActivityIndicator color={color.gold} style={{ marginVertical: spacing.md }} />
            ) : staffError ? (
              <Card>
                <Text style={styles.errorText}>{staffError}</Text>
                <Button
                  label="Retry"
                  variant="secondary"
                  size="sm"
                  onPress={() => selectedVenueId && loadStaff(selectedVenueId)}
                  style={{ marginTop: spacing.sm }}
                />
              </Card>
            ) : (
              <Card padded={false}>
                <View style={{ padding: spacing.md }}>
                  {staff.map((m) => (
                    <StaffRow
                      key={m.id}
                      member={m}
                      disableActions={m.kind === 'active' && m.role === 'Owner' && m.id === currentUserId}
                      onEdit={m.kind === 'active' ? () => setEditTarget(m) : undefined}
                      onRemove={() => handleRemove(m)}
                    />
                  ))}
                </View>
              </Card>
            ))}

          {mode === 'add' && selectedVenueId && (
            <InviteStaffForm venueId={selectedVenueId} onInvited={(member) => setStaff((prev) => [...prev, member])} />
          )}

          {mode === 'shifts' && (
            <ShiftCalendar
              staff={activeStaff}
              shifts={shifts}
              loading={shiftsLoading}
              error={shiftsError}
              onRetry={() => selectedVenueId && loadShifts(selectedVenueId)}
              onCellPress={handleShiftCellPress}
              savingCell={savingCell}
            />
          )}
        </>
      )}

      <EditStaffModal
        visible={editTarget !== null}
        member={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={(staffId, role, permissions) =>
          setStaff((prev) => prev.map((m) => (m.id === staffId ? { ...m, role, permissions } : m)))
        }
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontFamily: font.sans, fontSize: 13, color: color.textOnLightMuted, textAlign: 'center', paddingVertical: spacing.md },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});