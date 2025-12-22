export const CENTERED_NOTICE_EVENT = 'caracola:centered-notice';

export function emitCenteredNotice(message: string) {
  if (typeof window === 'undefined') return;
  const safeMessage = typeof message === 'string' ? message : String(message);
  window.dispatchEvent(
    new CustomEvent(CENTERED_NOTICE_EVENT, {
      detail: { message: safeMessage },
    })
  );
}
