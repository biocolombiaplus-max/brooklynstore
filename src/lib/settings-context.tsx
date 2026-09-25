'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SETTINGS, getSiteSettings } from './settings';
import { hexToRgbChannels } from './utils';
import { googleFontsHref, fontFamilyValue } from './fonts';
import type { SiteSettings } from './types';

const FONT_LINK_ID = 'site-google-fonts';

const SettingsContext = createContext<SiteSettings>(DEFAULT_SETTINGS);

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings ?? DEFAULT_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    getSiteSettings()
      .then((s) => !cancelled && setSettings(s))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', hexToRgbChannels(settings.colors.primary));
    root.style.setProperty('--color-primary-hover', hexToRgbChannels(settings.colors.primaryHover));
    root.style.setProperty('--color-primary-light', hexToRgbChannels(settings.colors.primaryLight));
    root.style.setProperty('--color-cream', hexToRgbChannels(settings.colors.cream));
    root.style.setProperty('--color-cream-alt', hexToRgbChannels(settings.colors.creamAlt));
    root.style.setProperty('--color-ink', hexToRgbChannels(settings.colors.ink));
    root.style.setProperty('--color-muted', hexToRgbChannels(settings.colors.muted));
    root.style.setProperty('--color-border', hexToRgbChannels(settings.colors.border));
  }, [settings.colors]);

  useEffect(() => {
    const { headingFont, bodyFont } = settings.fonts;

    let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = googleFontsHref([headingFont, bodyFont]);

    const root = document.documentElement;
    root.style.setProperty('--font-heading', fontFamilyValue(headingFont, 'serif'));
    root.style.setProperty('--font-body', fontFamilyValue(bodyFont, 'sans-serif'));
  }, [settings.fonts]);

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SettingsContext);
}
