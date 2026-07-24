import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenScaffold } from '../components/ScreenScaffold';
import { Card } from '../components/Card';
import { InfoRow } from '../components/InfoRow';
import { ToggleRow } from '../components/ToggleRow';
import { color, font, spacing } from '../theme/tokens';
import {
  partnerProfile,
  accountDetails,
  initialNotificationPreferences,
  maskValue,
  NotificationPreferences,
} from '../data/profileData';

export function ProfileScreen() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [prefs, setPrefs] = useState<NotificationPreferences>(initialNotificationPreferences);

  const toggleReveal = (field: string) => setRevealed((prev) => ({ ...prev, [field]: !prev[field] }));

  const initials = partnerProfile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2);

  return (
    <ScreenScaffold
      title="Profile"
      subtitle={partnerProfile.joinedLabel}
      variant="tall"
      chromeContent={
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.avatarName}>{partnerProfile.name}</Text>
            <Text style={styles.avatarOrg}>{partnerProfile.organisationName}</Text>
          </View>
        </View>
      }
    >
      {/* Partner details */}
      <Card>
        <Text style={styles.sectionHeader}>Partner details</Text>
        <View style={{ marginTop: spacing.xs }}>
          <InfoRow label="Full name" value={partnerProfile.name} />
          <InfoRow label="Email" value={partnerProfile.email} />
          <InfoRow label="Organisation" value={partnerProfile.organisationName} />
          <InfoRow label="Mobile number" value={partnerProfile.mobileNumber} />
          <InfoRow label="Location" value={partnerProfile.location} />
        </View>
      </Card>

      {/* Account details */}
      <Card>
        <Text style={styles.sectionHeader}>Account details</Text>
        <Text style={styles.sectionSub}>Sensitive fields are hidden by default — tap Show to reveal.</Text>
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

      {/* Notification preferences */}
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

  sectionHeader: { fontFamily: font.serifSemiBold, fontSize: 17, color: color.textOnLight },
  sectionSub: { fontFamily: font.sans, fontSize: 12, color: color.textOnLightMuted, marginTop: 2 },
});