'use client';

import { GooeyToaster } from 'goey-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <GooeyToaster position="bottom-right" />
    </>
  );
}
