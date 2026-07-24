import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { color, font, radius, spacing } from '../theme/tokens';

type Props = {
  title: string;
  subtitle?: string;
  /** Content rendered inside the dark chrome band, above the white sheet (e.g. today's headline number). */
  chromeContent?: React.ReactNode;
  children: React.ReactNode;
  /** Compact = shorter chrome band (dashboard, list screens). Tall = onboarding-style. */
  variant?: 'compact' | 'tall';
  rightAction?: React.ReactNode;
};

/**
 * Shared layout: sticky glass-effect dark header, compact brand-chrome band,
 * rounded-top white content sheet overlapping it. Used on every working screen
 * so the dashboard family reads as one product.
 */
export function ScreenScaffold({
  title,
  subtitle,
  chromeContent,
  children,
  variant = 'compact',
  rightAction,
}: Props) {
  return (
    <View style={styles.root}>
      <View style={[styles.chrome, variant === 'tall' && styles.chromeTall]}>
        <BlurView intensity={40} tint="dark" style={styles.glassHeader}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            {rightAction}
          </View>
        </BlurView>
        {chromeContent ? <View style={styles.chromeContentWrap}>{chromeContent}</View> : null}
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.chromeNavy },
  chrome: {
    backgroundColor: color.chromeNavy,
    paddingBottom: spacing.xl,
  },
  chromeTall: { paddingBottom: spacing.xxxl },
  glassHeader: {
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { fontFamily: font.serifSemiBold, fontSize: 22, color: color.textOnDark },
  subtitle: {
    fontFamily: font.sans,
    fontSize: 13,
    color: color.textOnDarkMuted,
    marginTop: 2,
  },
  chromeContentWrap: { paddingHorizontal: spacing.lg, marginTop: spacing.sm },
  sheet: {
    flex: 1,
    marginTop: -radius.xl,
    backgroundColor: color.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  sheetContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl + 80,
    gap: spacing.md,
  },
});
