import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { signUpPartner } from '../services/authService';

export function SignUpScreen({ navigation }: { navigation: any }) {
  const [fullName, setFullName] = useState('');
  const [organisationName, setOrganisationName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);

    if (!fullName.trim() || !organisationName.trim() || !email.trim() || !password) {
      setError('Please fill in your name, organisation, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await signUpPartner({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        organisationName: organisationName.trim(),
        phone: phone.trim(),
        location: location.trim(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>JP</Text>
          </View>
          <Text style={styles.brandName}>JustPlay Partner</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Create your partner account</Text>
          <Text style={styles.subtitle}>Tell us about yourself and your business.</Text>

          <Field label="Full name">
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Amit Sharma"
              placeholderTextColor={color.textOnDarkFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Organisation name">
            <TextInput
              value={organisationName}
              onChangeText={setOrganisationName}
              placeholder="e.g. Sunrise Sports Arena"
              placeholderTextColor={color.textOnDarkFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Mobile number">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="10-digit mobile number"
              placeholderTextColor={color.textOnDarkFaint}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </Field>

          <Field label="Location">
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Chandigarh, Punjab"
              placeholderTextColor={color.textOnDarkFaint}
              style={styles.input}
            />
          </Field>

          <Field label="Email">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@yourvenue.in"
              placeholderTextColor={color.textOnDarkFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
            />
          </Field>

          <Field label="Password">
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
              placeholderTextColor={color.textOnDarkFaint}
              secureTextEntry
              style={styles.input}
            />
          </Field>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <Button
            label={loading ? 'Creating account…' : 'Create account'}
            variant="primary"
            onPress={handleSignUp}
            loading={loading}
            fullWidth
            style={{ marginTop: spacing.sm }}
          />

          <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              Already have an account? <Text style={styles.switchTextBold}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.xs, marginBottom: spacing.md }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.chromeNavy },
  flex: { flex: 1 },
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

  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  title: { fontFamily: font.serifSemiBold, fontSize: 24, color: color.textOnDark },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: color.textOnDarkMuted, marginTop: 6, marginBottom: spacing.xl },

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
  errorText: { fontFamily: font.sansMedium, fontSize: 12, color: '#F87171', marginBottom: spacing.xs },

  switchLink: { marginTop: spacing.xl, alignItems: 'center' },
  switchText: { fontFamily: font.sans, fontSize: 13, color: color.textOnDarkMuted },
  switchTextBold: { fontFamily: font.sansSemiBold, color: color.gold },
});