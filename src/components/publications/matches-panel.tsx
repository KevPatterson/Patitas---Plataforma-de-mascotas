import { Link } from 'react-router-dom';
import { PawPrint } from 'lucide-react';

type Match = {
  publicationId: string;
  score: number;
  reasons: string[];
  publication: {
    slug: string;
    title: string;
    coverImageUrl: string | null;
  };
};

type MatchesPanelProps = {
  matches: Match[];
};

export function MatchesPanel({ matches }: MatchesPanelProps) {
  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-3xl border-2 border-[#CFEFE6] bg-[#CFEFE6]/20 p-6">
      <div>
        <h3 className="font-display text-2xl font-extrabold text-[#0B3B3C]" style={{ fontFamily: '"Baloo 2", cursive' }}>
          Posibles coincidencias
        </h3>
        <p className="mt-2 text-sm text-[#0B3B3C]/70">Encontramos casos con características similares. Revísalos para verificar si coinciden.</p>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <Link
            key={match.publicationId}
            to={`/p/${match.publication.slug}`}
            className="block overflow-hidden rounded-2xl border-2 border-[#CFEFE6] bg-white shadow-sm transition hover:-translate-y-0.5"
          >
            <div className="flex gap-4 p-4">
              <div className="size-20 shrink-0 overflow-hidden rounded-2xl bg-[#F5FBF9]">
                {match.publication.coverImageUrl ? (
                  <img src={match.publication.coverImageUrl} alt={match.publication.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#0B3B3C]/30">
                    <PawPrint className="size-7" aria-hidden="true" />
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[#0B3B3C]">{match.publication.title}</p>
                  <div className="shrink-0 rounded-full bg-[#0B3B3C] px-3 py-1 text-xs font-bold text-white">{match.score}%</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {match.reasons.slice(0, 3).map((reason, index) => (
                    <span key={index} className="rounded-full bg-[#CFEFE6] px-2 py-1 text-xs font-medium text-[#0B3B3C]">
                      {reason}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-xs italic text-[#0B3B3C]/60">Esta coincidencia es automática y puede no ser exacta. Verifica los detalles antes de contactar.</p>
    </div>
  );
}
