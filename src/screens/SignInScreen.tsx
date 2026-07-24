import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { color, font, radius, spacing } from '../theme/tokens';
import { signIn } from '../services/authService';

export function SignInScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      // No manual navigation needed here -- the auth state listener in
      // App.tsx swaps to the main app automatically once the session updates.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in. Please try again.');
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

        <View style={styles.content}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to manage your venue.</Text>

          <View style={styles.form}>
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
                placeholder="Enter your password"
                placeholderTextColor={color.textOnDarkFaint}
                secureTextEntry
                style={styles.input}
              />
            </Field>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Button
              label={loading ? 'Signing in…' : 'Sign in'}
              variant="primary"
              onPress={handleSignIn}
              loading={loading}
              fullWidth
              style={{ marginTop: spacing.sm }}
            />
          </View>

          <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.switchLink}>
            <Text style={styles.switchText}>
              New partner? <Text style={styles.switchTextBold}>Create an account</Text>
            </Text>
          </Pressable>
        </View>
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

  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.lg },
  title: { fontFamily: font.serifSemiBold, fontSize: 26, color: color.textOnDark },
  subtitle: { fontFamily: font.sans, fontSize: 14, color: color.textOnDarkMuted, marginTop: 6, marginBottom: spacing.xl },

  form: {},
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