import { ReactNode } from 'react';
import BottomNav from './BottomNav';
import LogoHeader from './LogoHeader';

const MobileLayout = ({ children, showNav = true, showLogo = true }: { children: ReactNode; showNav?: boolean; showLogo?: boolean }) => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      {showLogo && (
        <div className="sticky top-0 z-30 bg-background border-b border-border px-4 py-2 flex items-center">
          <LogoHeader />
        </div>
      )}
      <main className={showNav ? 'pb-20' : ''}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
