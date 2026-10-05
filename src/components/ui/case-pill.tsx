type CasePillProps = {
  label: string;
  tone: 'lost' | 'found' | 'abandoned' | 'adoption' | 'sighting';
};

const toneClasses: Record<CasePillProps['tone'], string> = {
  lost: 'bg-[#C2332C] text-white',
  found: 'bg-[#0E7C66] text-white',
  abandoned: 'bg-[#FFC857] text-[#0B3B3C]',
  adoption: 'bg-[#FFC857] text-[#0B3B3C]',
  sighting: 'bg-[#0E7C66] text-white',
};

export function CasePill({ label, tone }: CasePillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}
