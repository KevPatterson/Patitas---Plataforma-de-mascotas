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
  perdida: 'bg-[#C2332C] text-white',
  LOST: 'bg-[#C2332C] text-white',
  encontrada: 'bg-[#0E7C66] text-white',
  FOUND: 'bg-[#0E7C66] text-white',
  adopcion: 'bg-[#FFC857] text-[#0B3B3C]',
  ADOPTION: 'bg-[#FFC857] text-[#0B3B3C]',
  abandonada: 'bg-[#FFC857] text-[#0B3B3C]',
  ABANDONED: 'bg-[#FFC857] text-[#0B3B3C]',
  avistamiento: 'bg-[#0E7C66] text-white',
  SIGHTING: 'bg-[#0E7C66] text-white',
  activa: 'bg-[#CFEFE6] text-[#0B3B3C] border border-[#0B3B3C]/10',
  ACTIVE: 'bg-[#CFEFE6] text-[#0B3B3C] border border-[#0B3B3C]/10',
  resuelta: 'bg-[#0B3B3C] text-[#F5FBF9]',
  RESOLVED: 'bg-[#0B3B3C] text-[#F5FBF9]',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const label = labels[status] ?? status;
  const tone = toneByStatus[status] ?? 'bg-[#CFEFE6] text-[#0B3B3C]';
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide ${tone} ${className}`}
      style={{ fontFamily: 'Figtree, sans-serif' }}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
