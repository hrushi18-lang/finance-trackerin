import React from 'react';
import { useMobileDetection } from '../../hooks/useMobileDetection';
import { BottomNavigation } from './BottomNavigation';

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showBottomNav = true,
  className = ''
}) => {
  const { isMobile, isNative, safeAreaInsets } = useMobileDetection();

  if (!isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div 
      className={`mobile-layout ${className}`}
      style={{
        paddingTop: isNative ? `${safeAreaInsets.top}px` : '0',
        paddingBottom: isNative ? `${safeAreaInsets.bottom}px` : '0',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <main 
        className="flex-1 mobile-container mobile-scroll"
        style={{
          paddingBottom: showBottomNav ? '80px' : '0'
        }}
      >
        {children}
      </main>
      
      {showBottomNav && (
        <div 
          className="mobile-nav"
          style={{
            paddingBottom: isNative ? `${safeAreaInsets.bottom}px` : '0'
          }}
        >
          <BottomNavigation />
        </div>
      )}
    </div>
  );
};
