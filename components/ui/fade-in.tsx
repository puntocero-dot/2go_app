'use client';

import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ 
  children, 
  delay = 0,
  duration = 300,
  direction = 'up',
  className,
  style,
  ...props 
}: FadeInProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const directionStyles = {
    up: 'translate-y-2',
    down: '-translate-y-2',
    left: 'translate-x-2',
    right: '-translate-x-2',
    none: ''
  };
  
  return (
    <div 
      className={cn(
        'animate-in fade-in',
        direction !== 'none' && `slide-in-from-bottom-2`,
        className
      )}
      style={{ 
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: 'both',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function StaggeredFadeIn({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className
}: {
  children: ReactNode[];
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeIn 
          key={index} 
          delay={initialDelay + (index * staggerDelay)}
        >
          {child}
        </FadeIn>
      ))}
    </div>
  );
}
