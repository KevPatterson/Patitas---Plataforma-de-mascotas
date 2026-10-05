import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';
import type { PublicationSummary } from '../../lib/supabase/publication-search';
import { StatusBadge } from '../ui/status-badge';

type PublicationCardProps = {
  publication: PublicationSummary;
};

const typeLabels: Record<PublicationSummary['type'], string> = {
  LOST: 'Perdida',
  FOUND: 'Encontrada',
  ABANDONED: 'Abandonada',
  ADOPTION: 'En adopción',
  SIGHTING: 'Avistamiento',
};

export function PublicationCard({ publication }: PublicationCardProps) {
  return (
    <Link
      to={`/p/${publication.slug}`}
      className="group block overflow-hidden rounded-[24px] border-2 border-[#CFEFE6] bg-white shadow-[0_12px_32px_rgba(11,59,60,0.08)] transition hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(11,59,60,0.12)] dark:border-white/15 dark:bg-white"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#CFEFE6]/40">
        {publication.coverImageUrl ? (
          <img
            src={publication.coverImageUrl}
            alt={publication.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[#0B3B3C]/30">
            <PawPrint className="h-12 w-12" aria-hidden="true" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusBadge status={publication.type} />
        </div>
      </div>
      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-[22px] font-extrabold leading-tight text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
            {publication.title}
          </h2>
          <StatusBadge status={publication.status} className="shrink-0" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0B3B3C]/60">{typeLabels[publication.type]}</p>
        <p className="line-clamp-3 text-sm leading-6 text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
          {publication.description}
        </p>
        <p className="text-sm font-semibold text-[#0B3B3C]" style={{ fontFamily: 'Figtree, sans-serif' }}>
          {[publication.municipality, publication.province].filter(Boolean).join(', ')}
          {publication.zone ? ` · ${publication.zone}` : ''}
        </p>
      </div>
    </Link>
  );
}
