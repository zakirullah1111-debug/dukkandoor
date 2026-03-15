import { ReactNode } from 'react';
import BottomNav from './BottomNav';

const MobileLayout = ({ children, showNav = true }: { children: ReactNode; showNav?: boolean }) => {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative">
      <main className={showNav ? 'pb-20' : ''}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
};

export default MobileLayout;
