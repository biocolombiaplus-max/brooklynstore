'use client';

import { useSiteSettings } from '@/lib/settings-context';

const EDGE_FADE = 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)';

export default function AnnouncementBar() {
  const { announcementMessages } = useSiteSettings();
  const loop = [...announcementMessages, ...announcementMessages];

  return (
    <div className="overflow-hidden bg-ink py-2.5 text-white" style={{ WebkitMaskImage: EDGE_FADE, maskImage: EDGE_FADE }}>
      <div className="flex w-max animate-marquee-slow gap-10 whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em]">
        {loop.map((item, i) => (
          <span key={i} className="flex items-center gap-10">
            {item}
            <span className="text-primary-light">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
