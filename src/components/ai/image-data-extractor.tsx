import { useState, type ChangeEvent } from 'react';
import { Sparkles, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { PawLoader } from '../ui/paw-loader';

type ExtractedData = {
  // Datos del animal
  species?: string;
  breed?: string;
  sex?: string;
  size?: string;
  ageApprox?: string;
  color?: string;
  characteristics?: string;
  collar?: boolean;
  plate?: boolean;
  
  // Datos contextuales extraídos de texto en la imagen
  province?: string;
  municipality?: string;
  zone?: string;
  reward?: string;
  eventDate?: string;
  eventTimeApprox?: string;
  contactMode?: 'INTERNAL' | 'PHONE' | 'WHATSAPP' | 'EMAIL';
  contactPhone?: string;
  contactWhatsapp?: string;
  contactEmail?: string;
  
  // Metadatos
  confidence: number;
  hasTextOverlay?: boolean; // Indica si detectó texto en la imagen
};

type ImageDataExtractorProps = {
  onDataExtracted: (data: ExtractedData) => void;
  disabled?: boolean;
};

export function ImageDataExtractor({ onDataExtracted, disabled }: ImageDataExtractorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Formato no permitido. Usa JPG, PNG o WebP.');
      return;
    }

    // Validar tamaño (8 MB)
    const maxSize = 8 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('La imagen excede 8 MB.');
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
    setExtractedData(null);
  };

  const handleExtract = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      // Convertir el archivo a base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Image = await base64Promise;

      // Enviar la imagen al endpoint
      const response = await fetch('/api/ai/extract-from-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo procesar la imagen');
      }

      const data: ExtractedData = await response.json();
      setExtractedData(data);
      onDataExtracted(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la imagen');
    } finally {
      setProcessing(false);
    }
  };

  const handleClear = () => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setFile(null);
    setPreview(null);
    setError(null);
    setExtractedData(null);
  };

  return (
    <div className="space-y-4 rounded-3xl border-2 border-purple/20 bg-purple/5 p-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-purple/20 p-2">
          <Sparkles className="size-5 text-purple" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-lg font-bold text-navy">
            Asistente IA para Formulario
          </h3>
          <p className="mt-1 text-sm text-navy/70">
            Sube una imagen del animal y la IA extraerá automáticamente los datos para rellenar el formulario.
          </p>
        </div>
      </div>

      {!preview ? (
        <label
          className={[
            'block rounded-2xl border-2 border-dashed border-purple/30 bg-white p-8 text-center cursor-pointer transition-all hover:border-purple hover:bg-purple/5',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="sr-only"
            disabled={disabled}
          />
          <Upload className="size-12 mx-auto text-purple/40 mb-3" aria-hidden="true" />
          <p className="font-semibold text-navy mb-1">Haz clic para seleccionar una imagen</p>
          <p className="text-xs text-navy/60">JPG, PNG o WebP • Máximo 8 MB</p>
        </label>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-2xl overflow-hidden border-2 border-purple/20">
            <img src={preview} alt="Vista previa" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={handleClear}
              className="absolute top-2 right-2 rounded-full bg-navy/80 text-white p-2 hover:bg-navy transition backdrop-blur-sm"
              aria-label="Eliminar imagen"
              disabled={processing}
            >
              <X className="size-4" />
            </button>
          </div>

          {!extractedData && !processing && (
            <Button
              type="button"
              onClick={handleExtract}
              disabled={processing || disabled}
              variant="secondary"
              className="w-full gap-2"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              Extraer datos con IA
            </Button>
          )}

          {processing && (
            <div className="flex flex-col items-center gap-3 py-4">
              <PawLoader size="md" />
              <p className="text-sm font-medium text-navy/70">Analizando imagen...</p>
            </div>
          )}

          {extractedData && (
            <div className="space-y-3 rounded-2xl bg-turquoise/10 border-2 border-turquoise/20 p-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-turquoise/20 p-1">
                  <Sparkles className="size-4 text-turquoise" aria-hidden="true" />
                </div>
                <h4 className="font-semibold text-navy">Datos extraídos</h4>
                <span className="ml-auto text-xs font-semibold text-turquoise">
                  {Math.round(extractedData.confidence * 100)}% confianza
                </span>
              </div>

              <dl className="grid gap-2 text-sm">
                {extractedData.species && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Especie:</dt>
                    <dd className="font-semibold text-navy">{extractedData.species}</dd>
                  </div>
                )}
                {extractedData.breed && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Raza:</dt>
                    <dd className="font-semibold text-navy">{extractedData.breed}</dd>
                  </div>
                )}
                {extractedData.color && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Color:</dt>
                    <dd className="font-semibold text-navy">{extractedData.color}</dd>
                  </div>
                )}
                {extractedData.size && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Tamaño:</dt>
                    <dd className="font-semibold text-navy">{extractedData.size}</dd>
                  </div>
                )}
                {extractedData.sex && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Sexo:</dt>
                    <dd className="font-semibold text-navy">{extractedData.sex}</dd>
                  </div>
                )}
                {extractedData.ageApprox && (
                  <div className="flex justify-between">
                    <dt className="text-navy/60">Edad aproximada:</dt>
                    <dd className="font-semibold text-navy">{extractedData.ageApprox}</dd>
                  </div>
                )}
                {extractedData.characteristics && (
                  <div className="flex flex-col gap-1">
                    <dt className="text-navy/60">Características:</dt>
                    <dd className="text-navy">{extractedData.characteristics}</dd>
                  </div>
                )}
                {(extractedData.collar || extractedData.plate) && (
                  <div className="flex gap-2 flex-wrap pt-2">
                    {extractedData.collar && (
                      <span className="text-xs font-semibold bg-turquoise/20 text-turquoise px-3 py-1 rounded-full">
                        Collar detectado
                      </span>
                    )}
                    {extractedData.plate && (
                      <span className="text-xs font-semibold bg-purple/20 text-purple px-3 py-1 rounded-full">
                        Placa detectada
                      </span>
                    )}
                  </div>
                )}
              </dl>

              <p className="text-xs text-navy/60 pt-2 border-t border-turquoise/20">
                Los datos han sido rellenados en el formulario. Revísalos y edítalos si es necesario antes de publicar.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-lost/10 border-2 border-lost/20 px-4 py-3 text-sm">
          <AlertCircle className="size-5 text-lost shrink-0 mt-0.5" aria-hidden="true" />
          <p className="font-medium text-lost-dark">{error}</p>
        </div>
      )}

      <div className="text-xs text-navy/60 bg-purple/10 border border-purple/20 rounded-2xl px-4 py-3 space-y-1">
        <p className="font-semibold">Cómo funciona:</p>
        <ul className="space-y-1 pl-4 list-disc">
          <li>La IA analiza la imagen y detecta características del animal</li>
          <li>Los datos se rellenan automáticamente en el formulario</li>
          <li>Revisa y corrige cualquier dato antes de publicar</li>
          <li>La imagen no se guarda, solo se usa para extraer información</li>
        </ul>
      </div>
    </div>
  );
}
