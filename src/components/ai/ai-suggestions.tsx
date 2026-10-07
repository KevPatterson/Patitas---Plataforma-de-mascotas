import { useState } from 'react';
import { Sparkles, Check, X, Info } from 'lucide-react';
import { Button } from '../ui/button';
import type { AttributeSuggestion } from '../../lib/ai/processing';

type AISuggestionsProps = {
  suggestions: AttributeSuggestion[];
  onApply: (field: string, value: string) => void;
  onDismiss: (field: string) => void;
};

const fieldLabels: Record<string, string> = {
  species: 'Especie',
  breed: 'Raza',
  color: 'Color',
  sex: 'Sexo',
  size: 'Tamaño',
  collar: 'Collar',
  plate: 'Placa',
  contactPhone: 'Teléfono',
  contactWhatsapp: 'WhatsApp',
  contactEmail: 'Email',
  petName: 'Nombre de la mascota',
};

const sourceLabels: Record<string, string> = {
  vision: 'Análisis visual',
  ocr: 'Texto detectado',
  hybrid: 'Análisis combinado',
};

export function AISuggestions({ suggestions, onApply, onDismiss }: AISuggestionsProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (suggestions.length === 0) {
    return null;
  }

  const visibleSuggestions = suggestions.filter(
    (s) => !s.applied && !dismissed.has(s.field)
  );

  if (visibleSuggestions.length === 0) {
    return null;
  }

  const handleDismiss = (field: string) => {
    setDismissed(new Set([...dismissed, field]));
    onDismiss(field);
  };

  return (
    <div className="rounded-2xl border-2 border-purple/20 bg-purple/5 p-6 space-y-4">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded-lg bg-purple/20 flex items-center justify-center">
          <Sparkles className="size-4 text-purple" />
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-navy">
            Sugerencias de IA
          </h3>
          <p className="text-sm text-navy/70">
            Detectamos información automáticamente de tus imágenes
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {visibleSuggestions.map((suggestion) => (
          <div
            key={suggestion.field}
            className="group rounded-xl border-2 border-navy/10 bg-white p-4 transition-all hover:border-purple/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-navy text-sm">
                    {fieldLabels[suggestion.field] || suggestion.field}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple/10 text-purple text-xs font-medium">
                    {Math.round(suggestion.confidence * 100)}% confianza
                  </span>
                </div>

                <p className="text-navy font-semibold mb-1 truncate">
                  {suggestion.value}
                </p>

                <div className="flex items-center gap-1 text-xs text-navy/60">
                  <Info className="size-3" />
                  <span>
                    {sourceLabels[suggestion.source] || suggestion.source}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="primary"
                  onClick={() => onApply(suggestion.field, suggestion.value)}
                  className="px-3 py-1.5 min-h-0!"
                >
                  <Check className="size-4" />
                  <span className="hidden sm:inline">Aplicar</span>
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => handleDismiss(suggestion.field)}
                  className="px-2 py-1.5 min-h-0!"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-turquoise/5 border border-turquoise/20">
        <Info className="size-4 text-turquoise mt-0.5 shrink-0" />
        <p className="text-xs text-navy/70">
          Estas sugerencias fueron generadas automáticamente. Revisa y confirma antes de aplicar.
          Siempre puedes editar o rechazar las sugerencias.
        </p>
      </div>
    </div>
  );
}
