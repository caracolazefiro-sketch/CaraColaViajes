'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CENTERED_NOTICE_EVENT } from '../utils/centered-notice';

type CenteredNoticeDetail = { message?: string };

export default function CenteredNoticeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [message, setMessage] = useState<string>('');
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onNotice = (ev: Event) => {
      const custom = ev as CustomEvent<CenteredNoticeDetail>;
      const nextMessage = (custom.detail?.message ?? '').toString().trim();
      if (!nextMessage) return;

      setMessage(nextMessage);
      setVisible(true);

      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = window.setTimeout(() => {
        setVisible(false);
      }, 2200);
    };

    window.addEventListener(CENTERED_NOTICE_EVENT, onNotice);
    return () => {
      window.removeEventListener(CENTERED_NOTICE_EVENT, onNotice);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    };
  }, []);

  return (
    <>
      {children}
      {visible && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 pointer-events-none">
          <div className="mx-4 max-w-xl rounded-xl bg-red-600 text-white px-6 py-4 shadow-lg border border-red-200 text-center text-base font-bold">
            {message}
          </div>
        </div>
      )}
    </>
  );
}
