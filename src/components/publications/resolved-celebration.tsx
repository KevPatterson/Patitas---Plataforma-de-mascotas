import { Heart, Home, PawPrint, PartyPopper } from 'lucide-react';

type ResolvedCelebrationProps = {
  petName: string;
};

export function ResolvedCelebration({ petName }: ResolvedCelebrationProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border-2 border-[#CFEFE6] bg-gradient-to-br from-[#0E7C66]/10 via-white to-[#CFEFE6]/20 p-8 text-center shadow-sm">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(14,124,102,0.12),transparent_50%)] blur-2xl" />

      <div className="space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#0E7C66] text-white">
          <PartyPopper className="h-8 w-8" aria-hidden="true" />
        </div>

        <h2 className="font-display text-3xl font-extrabold text-[#0E7C66]" style={{ fontFamily: '"Baloo 2", cursive' }}>
          ¡{petName} está de vuelta en casa!
        </h2>

        <p className="mx-auto max-w-xl text-base leading-7 text-[#0B3B3C]/80" style={{ fontFamily: 'Figtree, sans-serif' }}>
          Gracias a todas las personas que ayudaron a compartir este caso. Juntos hacemos que las mascotas regresen con sus familias.
        </p>

        <div className="flex items-center justify-center gap-3 text-[#FF6B35]">
          <Heart className="h-6 w-6 animate-pulse" aria-hidden="true" />
          <PawPrint className="h-6 w-6 animate-pulse [animation-delay:100ms]" aria-hidden="true" />
          <Home className="h-6 w-6 animate-pulse [animation-delay:200ms]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
