import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';

const SPORTS = ['Cricket', 'Football', 'Badminton', 'Tennis', 'Pickleball', 'Basketball', 'Table Tennis'];
const STEPS = ['Business details', 'Courts & sports', 'Verification', 'Listing photos'];

export function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [courtCount, setCourtCount] = useState('');
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [docUploaded, setDocUploaded] = useState(false);
  const [photos, setPhotos] = useState<number>(0);

  const toggleSport = (sport: string) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        {/* Brand mark */}
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>JP</Text>
          </View>
          <Text style={styles.brandName}>JustPlay Partner</Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          {STEPS.map((label, i) => (
            <View key={label} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  i < step && styles.stepDotDone,
                  i === step && styles.stepDotActive,
                ]}
              >
                <Text style={[styles.stepDotText, i <= step && styles.stepDotTextActive]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i < step && styles.stepLineDone]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{STEPS[step]}</Text>
          <Text style={styles.subtitle}>
            {step === 0 && 'Tell us about your venue — this appears on your public listing.'}
            {step === 1 && 'Select the sports you offer and how many courts or turfs you run.'}
            {step === 2 && 'Upload a business document so we can verify and activate payouts.'}
            {step === 3 && 'Add photos so players know what to expect when they arrive.'}
          </Text>

          {step === 0 && (
            <View style={styles.form}>
              <Field label="Venue name">
                <TextInput
                  value={venueName}
                  onChangeText={setVenueName}
                  placeholder="e.g. Sunrise Sports Arena"
                  placeholderTextColor={color.textOnDarkFaint}
                  style={styles.input}
                />
              </Field>
              <Field label="Full address">
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Street, area, city, PIN code"
                  placeholderTextColor={color.textOnDarkFaint}
                  style={[styles.input, { height: 84 }]}
                  multiline
                  textAlignVertical="top"
                />
              </Field>
            </View>
          )}

          {step === 1 && (
            <View style={styles.form}>
              <Field label="Sports offered">
                <View style={styles.sportGrid}>
                  {SPORTS.map((sport) => {
                    const active = selectedSports.includes(sport);
                    return (
                      <Pressable
                        key={sport}
                        onPress={() => toggleSport(sport)}
                        style={[styles.sportChip, active && styles.sportChipActive]}
                      >
                        <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>
                          {sport}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Field>
              <Field label="Number of courts / turfs">
                <TextInput
                  value={courtCount}
                  onChangeText={setCourtCount}
                  placeholder="e.g. 4"
                  placeholderTextColor={color.textOnDarkFaint}
                  keyboardType="number-pad"
                  style={styles.input}
                />
              </Field>
            </View>
          )}

          {step === 2 && (
            <View style={styles.form}>
              <Field label="Business verification document">
                <Text style={styles.helpText}>
                  GST certificate, shop establishment license, or business PAN. Used only for verification and payout setup.
                </Text>
                <Pressable
                  onPress={() => setDocUploaded(true)}
                  style={[styles.uploadBox, docUploaded && styles.uploadBoxDone]}
                >
                  <Text style={styles.uploadIcon}>{docUploaded ? '✓' : '⬆'}</Text>
                  <Text style={styles.uploadText}>
                    {docUploaded ? 'Document uploaded — pending review' : 'Tap to upload document (PDF or image)'}
                  </Text>
                </Pressable>
              </Field>
            </View>
          )}

          {step === 3 && (
            <View style={styles.form}>
              <Field label="Listing photos">
                <Text style={styles.helpText}>Add at least 3 photos of your courts, entrance, and facilities.</Text>
                <View style={styles.photoGrid}>
                  {Array.from({ length: Math.max(photos, 0) }).map((_, i) => (
                    <View key={i} style={styles.photoThumb}>
                      <Text style={styles.photoThumbText}>📷</Text>
                    </View>
                  ))}
                  <Pressable
                    onPress={() => setPhotos((p) => p + 1)}
                    style={styles.photoAdd}
                  >
                    <Text style={styles.photoAddText}>+</Text>
                  </Pressable>
                </View>
              </Field>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 0 && (
            <Button label="Back" variant="secondary" onPress={back} style={styles.footerBtn} />
          )}
          <Button
            label={step === STEPS.length - 1 ? 'Submit for review' : 'Continue'}
            variant="primary"
            onPress={step === STEPS.length - 1 ? undefined : next}
            style={[styles.footerBtn, { flex: 1 }]}
            fullWidth
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.chromeNavy },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: color.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { fontFamily: font.sansBold, color: color.chromeBlack, fontSize: 14 },
  brandName: { fontFamily: font.serifSemiBold, color: color.textOnDark, fontSize: 17 },

  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: color.textOnDarkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: { borderColor: color.gold, backgroundColor: color.goldMuted },
  stepDotDone: { borderColor: color.gold, backgroundColor: color.gold },
  stepDotText: { fontFamily: font.sansSemiBold, fontSize: 11, color: color.textOnDarkFaint },
  stepDotTextActive: { color: color.gold },
  stepLine: { flex: 1, height: 1, backgroundColor: color.textOnDarkFaint, marginHorizontal: 6 },
  stepLineDone: { backgroundColor: color.gold },

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg },
  title: { fontFamily: font.serifSemiBold, fontSize: 24, color: color.textOnDark },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: color.textOnDarkMuted, marginTop: -spacing.sm, lineHeight: 20 },

  form: { gap: spacing.lg, marginTop: spacing.sm },
  fieldLabel: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnDarkMuted },
  input: {
    backgroundColor: color.chromeNavyLight,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontFamily: font.sans,
    fontSize: 15,
    color: color.textOnDark,
  },
  helpText: { fontFamily: font.sans, fontSize: 12, color: color.textOnDarkFaint, lineHeight: 17 },

  sportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  sportChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: color.chromeNavyLight,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sportChipActive: { backgroundColor: color.goldMuted, borderColor: color.goldBorder },
  sportChipText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnDarkMuted },
  sportChipTextActive: { color: color.gold, fontFamily: font.sansSemiBold },

  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: radius.md,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: color.chromeNavyLight,
  },
  uploadBoxDone: { borderColor: color.goldBorder, borderStyle: 'solid' },
  uploadIcon: { fontSize: 22, color: color.gold },
  uploadText: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnDarkMuted, textAlign: 'center' },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  photoThumb: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    backgroundColor: color.chromeNavyLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoThumbText: { fontSize: 22 },
  photoAdd: {
    width: 84,
    height: 84,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: 26, color: color.gold, fontFamily: font.sans },

  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  footerBtn: { flex: 1 },
});
