import { useIntersectionObserver } from '../../lib/utils/intersection-observer';

type ScrollRevealProps = {
  children: React.ReactNode;
  animation?: 'fade-up' | 'fade-in-left' | 'fade-in-right' | 'scale-in' | 'slide-up';
  delay?: number;
  className?: string;
};

/**
 * Componente que anima su contenido cuando entra al viewport
 */
export function ScrollReveal({ 
  children, 
  animation = 'fade-up', 
  delay = 0,
  className = '' 
}: ScrollRevealProps) {
  const [ref, isIntersecting] = useIntersectionObserver();

  return (
    <div
      ref={ref}
      className={[
        'scroll-animation',
        isIntersecting ? `visible animate-${animation}` : '',
        className
      ].join(' ')}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

type StaggerListProps = {
  children: React.ReactNode[];
  animation?: 'fade-up' | 'fade-in-left' | 'fade-in-right' | 'scale-in';
  staggerDelay?: number;
  className?: string;
};

/**
 * Lista con animación stagger
 */
export function StaggerList({ 
  children, 
  animation = 'fade-up',
  staggerDelay = 100,
  className = ''
}: StaggerListProps) {
  const [ref, isIntersecting] = useIntersectionObserver();

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={[
            'scroll-animation',
            isIntersecting ? `visible animate-${animation}` : ''
          ].join(' ')}
          style={{ animationDelay: `${index * staggerDelay}ms` }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
