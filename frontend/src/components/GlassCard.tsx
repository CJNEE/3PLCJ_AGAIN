import React, { ReactNode } from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className = '', ...rest }: GlassCardProps) => {
  return (
    <div
      className={`backdrop-blur-sm bg-white/10 border border-white/20 rounded-xl shadow-lg p-4 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
