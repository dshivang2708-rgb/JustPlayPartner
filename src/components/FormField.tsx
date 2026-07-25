import React from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

/** Labeled text input for forms/modals -- same visual language as SearchInput, plus a label and inline error slot. */
export function FormField({ label, error, style, ...inputProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={color.textOnLightFaint}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...inputProps}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: font.sansMedium, fontSize: 13, color: color.textOnLight },
  input: {
    backgroundColor: color.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: color.border,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontFamily: font.sans,
    fontSize: 14,
    color: color.textOnLight,
  },
  inputError: { borderColor: color.danger },
  error: { fontFamily: font.sans, fontSize: 12, color: color.danger },
});