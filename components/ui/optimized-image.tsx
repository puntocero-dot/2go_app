'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  containerClassName?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  fallbackIcon?: React.ReactNode;
}

/**
 * Componente de imagen optimizada con:
 * - Loading state con skeleton
 * - Fallback para errores
 * - Soporte para Cloudinary y otras fuentes
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  containerClassName,
  objectFit = 'cover',
  fallbackIcon
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Si hay error, mostrar fallback
  if (error || !src) {
    return (
      <div 
        className={cn(
          'flex items-center justify-center bg-muted',
          fill ? 'absolute inset-0' : '',
          containerClassName
        )}
        style={!fill ? { width, height } : undefined}
      >
        {fallbackIcon || <ImageIcon className="h-8 w-8 text-muted-foreground" />}
      </div>
    );
  }
  
  // Determinar si es una URL externa (Cloudinary, etc.)
  const isExternal = src.startsWith('http://') || src.startsWith('https://');
  
  return (
    <div 
      className={cn(
        'relative overflow-hidden',
        fill ? '' : 'inline-block',
        containerClassName
      )}
      style={!fill ? { width, height } : undefined}
    >
      {/* Skeleton mientras carga */}
      {loading && (
        <div 
          className={cn(
            'absolute inset-0 bg-muted animate-pulse',
            fill ? '' : 'rounded'
          )}
        />
      )}
      
      {isExternal ? (
        // Para imágenes externas (Cloudinary), usar img nativo con lazy loading
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={cn(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            fill ? 'absolute inset-0 w-full h-full' : '',
            className
          )}
          style={{ objectFit }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
        />
      ) : (
        // Para imágenes locales, usar next/image
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          priority={priority}
          className={cn(
            'transition-opacity duration-300',
            loading ? 'opacity-0' : 'opacity-100',
            className
          )}
          style={{ objectFit }}
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}

/**
 * Avatar optimizado con fallback de iniciales
 */
export function OptimizedAvatar({
  src,
  alt,
  name,
  size = 'md',
  className
}: {
  src?: string | null;
  alt: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-lg',
    xl: 'h-24 w-24 text-2xl'
  };
  
  const sizePx = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96
  };
  
  // Obtener iniciales del nombre
  const initials = name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || '?';
  
  if (!src) {
    return (
      <div 
        className={cn(
          'rounded-full bg-madera-natural/10 flex items-center justify-center font-medium text-madera-natural',
          sizeClasses[size],
          className
        )}
      >
        {initials}
      </div>
    );
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePx[size]}
      height={sizePx[size]}
      className={cn('rounded-full', className)}
      containerClassName={cn('rounded-full', sizeClasses[size])}
      fallbackIcon={
        <span className={cn('font-medium text-madera-natural', sizeClasses[size])}>
          {initials}
        </span>
      }
    />
  );
}
