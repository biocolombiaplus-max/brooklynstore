'use client';

import Header from './Header';
import Footer from './Footer';
import AnnouncementBar from './AnnouncementBar';
import CartDrawer from './CartDrawer';
import FloatingWhatsApp from './FloatingWhatsApp';
import FloatingBadge from './FloatingBadge';
import SpinWheel from './SpinWheel';
import { SettingsProvider } from '@/lib/settings-context';
import type { SiteSettings } from '@/lib/types';

export default function SiteChrome({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings;
}) {
  return (
    <SettingsProvider initialSettings={initialSettings}>
      <AnnouncementBar />
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
      <FloatingBadge />
      <SpinWheel />
    </SettingsProvider>
  );
}
