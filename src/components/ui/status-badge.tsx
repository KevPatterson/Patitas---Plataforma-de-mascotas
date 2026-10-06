type StatusTone = 'perdida' | 'encontrada' | 'adopcion' | 'abandonada' | 'avistamiento' | 'activa' | 'resuelta';

type StatusBadgeProps = {
  status: StatusTone | string;
  className?: string;
};

const labels: Record<string, string> = {
  perdida: 'Perdida',
  LOST: 'Perdida',
  encontrada: 'Encontrada',
  FOUND: 'Encontrada',
  adopcion: 'En adopción',
  ADOPTION: 'En adopción',
  abandonada: 'Abandonada',
  ABANDONED: 'Abandonada',
  avistamiento: 'Avistamiento',
  SIGHTING: 'Avistamiento',
  activa: 'Activa',
  ACTIVE: 'Activa',
  resuelta: 'Resuelta',
  RESOLVED: 'Resuelta',
};

const toneByStatus: Record<string, string> = {
  perdida: 'bg-lost text-white shadow-sm',
  LOST: 'bg-lost text-white shadow-sm',
  encontrada: 'bg-found text-white shadow-sm',
  FOUND: 'bg-found text-white shadow-sm',
  adopcion: 'bg-purple text-white shadow-sm',
  ADOPTION: 'bg-purple text-white shadow-sm',
  abandonada: 'bg-orange text-white shadow-sm',
  ABANDONED: 'bg-orange text-white shadow-sm',
  avistamiento: 'bg-turquoise text-white shadow-sm',
  SIGHTING: 'bg-turquoise text-white shadow-sm',
  activa: 'bg-turquoise/10 text-turquoise border border-turquoise/30',
  ACTIVE: 'bg-turquoise/10 text-turquoise border border-turquoise/30',
  resuelta: 'bg-navy text-cream shadow-sm',
  RESOLVED: 'bg-navy text-cream shadow-sm',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const label = labels[status] ?? status;
  const tone = toneByStatus[status] ?? 'bg-navy/10 text-navy border border-navy/20';
  return (
    <span
      className={`inline-flex items-center rounded-pill px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all duration-base hover:scale-105 ${tone} ${className}`}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
