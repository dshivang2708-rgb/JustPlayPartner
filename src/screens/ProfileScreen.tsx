import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { ToggleRow } from '../components/ToggleRow';
import { Button } from '../components/Button';
import { EditProfileModal } from '../components/EditProfileModal';
import { color, font, spacing } from '../theme/tokens';
import { fetchMyProfile, ProfileRecord } from '../services/profileService';
import {
  accountDetails,
  initialNotificationPreferences,
  maskValue,
  NotificationPreferences,
} from '../data/profileData';

export function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editVisible, setEditVisible] = useState(false);

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialNotificationPreferences);

  const toggleReveal = (field: string) => setRevealed((prev) => ({ ...prev, [field]: !prev[field] }));

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchMyProfile();
      setProfile(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not load your profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <ScreenScaffold title="Profile" variant="tall">
        <ActivityIndicator color={color.gold} style={{ marginTop: spacing.xl }} />
      </ScreenScaffold>
    );
  }

  if (loadError || !profile) {
    return (
      <ScreenScaffold title="Profile" variant="tall">
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{loadError ?? 'Something went wrong.'}</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={loadProfile} style={{ marginTop: spacing.sm }} />
        </View>
      </ScreenScaffold>
    );
  }

  const initials =
    profile.fullName
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?';

  return (
    <ScreenScaffold
      title="Profile"
      subtitle={profile.joinedLabel}
      variant="tall"
      chromeContent={
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.avatarName}>{profile.fullName}</Text>
            <Text style={styles.avatarOrg}>{profile.organisationName || 'No organisation set'}</Text>
          </View>
        </View>
      }
    >
      {/* Partner details -- live from Supabase (profiles table + auth email) */}
      <Card>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Partner details</Text>
          <Pressable onPress={() => setEditVisible(true)} hitSlop={8}>
            <Text style={styles.editLink}>Edit</Text>
          </Pressable>
        </View>
        <View style={{ marginTop: spacing.xs }}>
          <InfoRow label="Full name" value={profile.fullName} />
          <InfoRow label="Email" value={profile.email} />
          <InfoRow label="Organisation" value={profile.organisationName || '—'} />
          <InfoRow label="Mobile number" value={profile.phone || '—'} />
          <InfoRow label="Location" value={profile.location || '—'} />
        </View>
      </Card>

      {/* Account details -- placeholder data. There's no payment_details table
          in the schema yet, so this stays mocked until that's built out;
          nothing here is read from or written to Supabase. */}
      <Card>
        <Text style={styles.sectionHeader}>Account details</Text>
        <Text style={styles.sectionSub}>
          Sample data for now — sensitive fields are hidden by default. Tap Show to reveal.
        </Text>
        <View style={{ marginTop: spacing.xs }}>
          <InfoRow
            label="Account number"
            value={revealed.accountNumber ? accountDetails.accountNumber : maskValue(accountDetails.accountNumber)}
            masked
            revealed={revealed.accountNumber}
            onToggleReveal={() => toggleReveal('accountNumber')}
          />
          <InfoRow label="Account name" value={accountDetails.accountName} />
          <InfoRow label="IFSC code" value={accountDetails.ifscCode} />
          <InfoRow
            label="PAN number"
            value={revealed.panNumber ? accountDetails.panNumber : maskValue(accountDetails.panNumber)}
            masked
            revealed={revealed.panNumber}
            onToggleReveal={() => toggleReveal('panNumber')}
          />
          <InfoRow
            label="GSTIN"
            value={revealed.gstin ? accountDetails.gstin : maskValue(accountDetails.gstin)}
            masked
            revealed={revealed.gstin}
            onToggleReveal={() => toggleReveal('gstin')}
          />
          <InfoRow label="CIN" value={accountDetails.cin} />
          <InfoRow label="Branch address" value={accountDetails.branchAddress} />
        </View>
      </Card>

      {/* Notification preferences -- local only for now; not yet persisted
          to Supabase (no notification_preferences table exists). */}
      <Card>
        <Text style={styles.sectionHeader}>Get updates via</Text>
        <View style={{ marginTop: spacing.xs }}>
          <ToggleRow
            label="WhatsApp"
            description="Booking alerts, payment confirmations, and reminders"
            value={prefs.whatsappUpdates}
            onValueChange={(v) => setPrefs((p) => ({ ...p, whatsappUpdates: v }))}
          />
          <ToggleRow
            label="Email"
            description="Reports, invoices, and account notices"
            value={prefs.emailUpdates}
            onValueChange={(v) => setPrefs((p) => ({ ...p, emailUpdates: v }))}
          />
        </View>
      </Card>

      <EditProfileModal
        visible={editVisible}
        profile={profile}
        onClose={() => setEditVisible(false)}
        onSaved={(updated) => setProfile(updated)}
      />
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  avatarBlock: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: color.goldMuted,
    borderWidth: 1,
    borderColor: color.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: font.serifSemiBold, fontSize: 20, color: color.gold },
  avatarName: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnDark },
  avatarOrg: { fontFamily: font.sans, fontSize: 13, color: color.textOnDarkMuted, marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  sectionSub: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
  editLink: { fontFamily: font.sansSemiBold, fontSize: 13, color: color.gold },

  errorBox: { paddingVertical: spacing.xl, alignItems: 'center', paddingHorizontal: spacing.lg },
  errorText: { fontFamily: font.sans, fontSize: 13, color: color.danger, textAlign: 'center' },
});