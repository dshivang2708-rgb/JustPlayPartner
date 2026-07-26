import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { color, font, radius, spacing } from '../theme/tokens';

type DialogState = {
  kind: 'confirm' | 'notify';
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm?: () => void;
} | null;

// Module-level bridge so the imperative confirmAction()/notify() calls in
// lib/confirm.ts (used from anywhere in the app, no hooks needed) can
// trigger this component's state without React Context boilerplate.
let dispatch: ((state: NonNullable<DialogState>) => void) | null = null;

export function showDialog(state: NonNullable<DialogState>) {
  console.log('[DEBUG] showDialog called, host mounted?', !!dispatch); // TEMP -- remove after debugging
  if (dispatch) {
    dispatch(state);
  } else {
    // Host not mounted yet (shouldn't happen if it's rendered in App.tsx) --
    // fail loudly in dev rather than silently doing nothing, which is the
    // exact bug this component exists to avoid.
    console.warn('[ConfirmDialogHost] not mounted -- dialog could not be shown:', state.title);
  }
}

/**
 * Renders a real React Native <Modal> for confirm/notify dialogs instead of
 * window.confirm/Alert.alert.
 *
 * Why: window.confirm/window.alert are blocked (return instantly, no UI) in
 * sandboxed web contexts such as embedded preview iframes -- a very common
 * way to run `expo start --web` during development. When that happens, code
 * built on those browser APIs looks like it does *nothing* when pressed:
 * no dialog, no error, no navigation. A same-app Modal has no such
 * dependency and works identically on web, iOS, and Android.
 *
 * Mount this once near the root of the app (see App.tsx) -- everything
 * else keeps calling confirmAction()/notify() exactly as before.
 */
export function ConfirmDialogHost() {
  const [state, setState] = useState<DialogState>(null);

  useEffect(() => {
    dispatch = (next) => setState(next);
    return () => {
      dispatch = null;
    };
  }, []);

  if (!state) return null;

  const close = () => setState(null);

  const handleConfirm = () => {
    const { onConfirm } = state;
    close();
    onConfirm?.();
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={close} statusBarTranslucent>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={state.kind === 'confirm' ? close : undefined} />
        <View style={styles.card}>
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}

          <View style={styles.row}>
            {state.kind === 'confirm' ? (
              <>
                <Pressable style={[styles.btn, styles.cancelBtn]} onPress={close}>
                  <Text style={styles.cancelLabel}>{state.cancelLabel ?? 'Cancel'}</Text>
                </Pressable>
                <Pressable
                  style={[styles.btn, state.destructive ? styles.dangerBtn : styles.confirmBtn]}
                  onPress={handleConfirm}
                >
                  <Text style={state.destructive ? styles.dangerLabel : styles.confirmLabel}>
                    {state.confirmLabel ?? 'Confirm'}
                  </Text>
                </Pressable>
              </>
            ) : (
              <Pressable style={[styles.btn, styles.confirmBtn, { flex: 1 }]} onPress={close}>
                <Text style={styles.confirmLabel}>OK</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 20, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: color.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  title: { fontFamily: font.serifSemiBold, fontSize: 18, color: color.textOnLight },
  message: { fontFamily: font.sans, fontSize: 14, color: color.textOnLightMuted, marginTop: spacing.xs, lineHeight: 20 },
  row: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  btn: { flex: 1, paddingVertical: 12, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { backgroundColor: color.background, borderWidth: 1, borderColor: color.border },
  cancelLabel: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.textOnLight },
  confirmBtn: { backgroundColor: color.gold },
  confirmLabel: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.chromeBlack },
  dangerBtn: { backgroundColor: color.dangerBg },
  dangerLabel: { fontFamily: font.sansSemiBold, fontSize: 14, color: color.danger },
});