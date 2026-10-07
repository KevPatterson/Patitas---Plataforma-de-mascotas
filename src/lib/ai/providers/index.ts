import type { IAIProvider } from '../provider-interface';
import type { AIProvider } from '../types';
import { MockAIProvider } from './mock-provider';

/**
 * Factory para obtener el proveedor de IA configurado
 * 
 * En producción, esto debería leer de variables de entorno
 * y devolver el proveedor correspondiente (OpenAI, Anthropic, etc.)
 */
export function getAIProvider(providerName?: AIProvider): IAIProvider {
  // Por ahora, siempre devuelve el mock provider
  // En el futuro, esto se puede expandir para soportar proveedores reales
  
  const provider = providerName ?? 'CUSTOM';

  switch (provider) {
    case 'CUSTOM':
    case 'OPENAI':
    case 'ANTHROPIC':
    case 'GOOGLE':
    case 'CLOUDFLARE':
      // Todos usan mock por ahora
      return new MockAIProvider();
    default:
      console.warn(`Unknown AI provider: ${provider}, falling back to mock`);
      return new MockAIProvider();
  }
}

/**
 * Verificar si el proveedor está configurado con API keys
 */
export function isProviderConfigured(provider: AIProvider): boolean {
  // En el futuro, esto verificará las variables de entorno
  // Por ahora, el mock siempre está "configurado"
  return provider === 'CUSTOM';
}

/**
 * Obtener el costo estimado de una operación de IA
 * (para control de costos)
 */
export function estimateOperationCost(
  operation: 'text' | 'vision' | 'embedding' | 'ocr' | 'moderation',
  provider: AIProvider
): number {
  // Mock provider es gratis
  if (provider === 'CUSTOM') {
    return 0;
  }

  // Costos estimados en USD (valores aproximados)
  const costs: Record<typeof operation, number> = {
    text: 0.001,
    vision: 0.005,
    embedding: 0.0001,
    ocr: 0.002,
    moderation: 0.0005,
  };

  return costs[operation] ?? 0;
}
