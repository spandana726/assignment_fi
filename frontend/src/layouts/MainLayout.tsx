/** Default layout wrapper — provides consistent page structure. */

import type { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
