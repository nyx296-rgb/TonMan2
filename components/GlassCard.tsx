
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`glass-card p-6 rounded-2xl ${className}`}>
      {title && <h3 className="text-xl font-bold mb-4 text-white/90">{title}</h3>}
      {children}
    </div>
  );
};
