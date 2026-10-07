import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { ProcessingStatus } from '../../lib/ai/processing';

type ProcessingStatusBadgeProps = {
  status: ProcessingStatus;
  compact?: boolean;
};

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pendiente',
    color: 'text-navy/40',
    bg: 'bg-navy/5',
  },
  processing: {
    icon: Loader2,
    label: 'Procesando',
    color: 'text-turquoise',
    bg: 'bg-turquoise/10',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completado',
    color: 'text-purple',
    bg: 'bg-purple/10',
  },
  partial: {
    icon: AlertCircle,
    label: 'Parcial',
    color: 'text-orange',
    bg: 'bg-orange/10',
  },
  failed: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-lost',
    bg: 'bg-lost/10',
  },
};

export function ProcessingStatusBadge({ status, compact = false }: ProcessingStatusBadgeProps) {
  const config = statusConfig[status.overall];
  const Icon = config.icon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.color} text-xs font-medium`}
      >
        <Icon className={`size-3 ${status.overall === 'processing' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-navy/10 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`size-8 rounded-lg ${config.bg} flex items-center justify-center`}>
          <Icon className={`size-4 ${config.color} ${status.overall === 'processing' ? 'animate-spin' : ''}`} />
        </div>
        <div>
          <h4 className="font-bold text-navy text-sm">Análisis inteligente</h4>
          <p className="text-xs text-navy/60">{config.label}</p>
        </div>
      </div>

      {status.overall === 'processing' && (
        <div className="space-y-2">
          <ProcessingItem label="OCR" status={status.ocr} />
          <ProcessingItem label="Visión" status={status.vision} />
          <ProcessingItem label="Embeddings" status={status.embedding} />
          <ProcessingItem label="Moderación" status={status.moderation} />
        </div>
      )}

      {status.overall === 'completed' && (
        <p className="text-xs text-navy/70">
          Análisis completado. Revisa las sugerencias automáticas.
        </p>
      )}

      {status.overall === 'partial' && (
        <p className="text-xs text-orange">
          Algunos análisis fallaron, pero tienes resultados disponibles.
        </p>
      )}

      {status.overall === 'failed' && (
        <p className="text-xs text-lost">
          El análisis no pudo completarse. Puedes continuar sin sugerencias automáticas.
        </p>
      )}
    </div>
  );
}

function ProcessingItem({
  label,
  status,
}: {
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon
        className={`size-3 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`}
      />
      <span className="text-xs text-navy/70">{label}</span>
      <div className="flex-1 h-1 bg-navy/5 rounded-full overflow-hidden">
        {status === 'completed' && (
          <div className="h-full bg-purple rounded-full transition-all duration-500 w-full" />
        )}
        {status === 'processing' && (
          <div className="h-full bg-turquoise rounded-full transition-all duration-500 w-1/2 animate-pulse" />
        )}
        {status === 'failed' && (
          <div className="h-full bg-lost rounded-full transition-all duration-500 w-full" />
        )}
      </div>
    </div>
  );
}
