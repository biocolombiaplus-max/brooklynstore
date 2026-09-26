import HelpNav from '@/components/help/HelpNav';
import HelpContactCard from '@/components/help/HelpContactCard';

export default function AyudaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-cream-alt/50">
      <div className="container-page py-8 sm:py-12">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10">
          <aside>
            <HelpNav />
          </aside>
          <div className="min-w-0">
            {children}
            <HelpContactCard />
          </div>
        </div>
      </div>
    </div>
  );
}
