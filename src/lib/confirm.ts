import { showDialog } from '../components/ConfirmDialogHost';

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

/**
 * Cross-platform confirm dialog.
 *
 * This renders a real in-app <Modal> (see ConfirmDialogHost.tsx) rather
 * than calling window.confirm/Alert.alert directly. Those browser/native
 * APIs are blocked in some contexts -- most notably sandboxed web preview
 * iframes, where window.confirm() returns instantly without showing
 * anything -- so a destructive confirmation (log out, delete, etc.) built
 * directly on them can silently do nothing when tapped. A same-app Modal
 * has no such dependency and behaves identically everywhere.
 */
export function confirmAction(
  { title, message, confirmLabel, cancelLabel, destructive }: ConfirmOptions,
  onConfirm: () => void
) {
  console.log('[DEBUG] confirmAction called:', title); // TEMP -- remove after debugging
  showDialog({ kind: 'confirm', title, message, confirmLabel, cancelLabel, destructive, onConfirm });
}

/** Cross-platform equivalent of a plain single-button Alert.alert(title, message). */
export function notify(title: string, message?: string) {
  showDialog({ kind: 'notify', title, message });
}