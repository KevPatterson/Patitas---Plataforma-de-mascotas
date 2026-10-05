type StatCardProps = {
  value: string;
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
};

const toneStyles = {
  default: 'text-[#0B3B3C]',
  success: 'text-[#0E7C66]',
  warning: 'text-[#C2332C]',
  danger: 'text-[#C2332C]',
};

export function StatCard({ value, label, tone = 'default' }: StatCardProps) {
  return (
    <article className="rounded-[16px] border-2 border-[#CFEFE6] bg-white p-5 shadow-sm">
      <p className={`font-display text-3xl font-extrabold tracking-tight ${toneStyles[tone]}`} style={{ fontFamily: '"Baloo 2", cursive' }}>
        {value}
      </p>
      <p className="mt-2 text-sm text-[#0B3B3C]/70" style={{ fontFamily: 'Figtree, sans-serif' }}>
        {label}
      </p>
    </article>
  );
}
