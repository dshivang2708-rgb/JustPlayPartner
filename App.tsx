import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import type { Session } from '@supabase/supabase-js';
import { useAppFonts } from './src/theme/useAppFonts';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthNavigator } from './src/navigation/AuthNavigator';
import { supabase } from './src/lib/supabase';
import { color } from './src/theme/tokens';

// To preview Onboarding (screen 1) standalone instead of the real auth flow:
// import { OnboardingScreen } from './src/screens/OnboardingScreen';
// <OnboardingScreen />

export default function App() {
  const fontsReady = useAppFonts();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const acceptedInvitesForUserId = useRef<string | null>(null);

  useEffect(() => {
    // Check for an existing session on launch (e.g. the user already signed
    // in previously and their session is still persisted in AsyncStorage).
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoading(false);
    });

    // Stay in sync with sign-in / sign-up / sign-out from anywhere in the
    // app -- this is what makes SignInScreen/SignUpScreen not need to
    // manually navigate on success; the session change flows here instead.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Covers the case where a staff invitation was created while this user
    // already had a persisted session (so signIn()/signUpPartner() -- which
    // also call this -- never ran again). Runs once per restored session,
    // guarded by user id so it doesn't refire on every token auto-refresh.
    if (session?.user?.id && acceptedInvitesForUserId.current !== session.user.id) {
      acceptedInvitesForUserId.current = session.user.id;
      (async () => {
        try {
          await supabase.rpc('accept_my_staff_invitations');
        } catch {
          // Non-fatal -- see acceptPendingStaffInvitations() in authService.ts.
        }
      })();
    }
  }, [session?.user?.id]);

  if (!fontsReady || sessionLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.chromeNavy }}>
        <ActivityIndicator color={color.gold} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        {session ? <RootNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}