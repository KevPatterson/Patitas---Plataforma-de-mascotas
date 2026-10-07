// Tipos para el sistema de IA

export type AIProvider = 'OPENAI' | 'ANTHROPIC' | 'GOOGLE' | 'CLOUDFLARE' | 'CUSTOM';

export type AIJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'CANCELLED';

export type AIJobType = 'ocr' | 'vision' | 'embedding_text' | 'embedding_image' | 'moderation' | 'extraction';

export type ModerationClassification = 'SAFE' | 'SPAM' | 'FRAUD' | 'OFFENSIVE' | 'INAPPROPRIATE' | 'UNRELATED' | 'UNCERTAIN';

export type AIJob = {
  id: string;
  publication_id: string;
  job_type: AIJobType;
  status: AIJobStatus;
  provider?: AIProvider;
  model?: string;
  model_version?: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type OCRResult = {
  id: string;
  publication_image_id: string;
  job_id?: string;
  provider: AIProvider;
  model?: string;
  extracted_text?: string;
  confidence?: number;
  language?: string;
  bounding_boxes?: Array<{
    text: string;
    bbox: [number, number, number, number];
    confidence: number;
  }>;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type VisionResult = {
  id: string;
  publication_image_id: string;
  job_id?: string;
  provider: AIProvider;
  model: string;
  model_version?: string;
  created_at: string;
  metadata: Record<string, unknown>;
};

export type ExtractedAttribute = {
  id: string;
  vision_result_id?: string;
  ocr_result_id?: string;
  publication_id?: string;
  attribute_key: string;
  attribute_value: string;
  confidence: number;
  source: 'vision' | 'ocr' | 'hybrid';
  created_at: string;
  metadata: Record<string, unknown>;
};

export type TextEmbedding = {
  id: string;
  publication_id: string;
  job_id?: string;
  provider: AIProvider;
  model: string;
  model_version?: string;
  embedding_dimension: number;
  embedding?: number[]; // Vector si pgvector disponible
  embedding_data?: number[]; // Fallback jsonb
  text_source: 'title' | 'description' | 'combined' | 'attributes';
  created_at: string;
  updated_at: string;
};

export type ImageEmbedding = {
  id: string;
  publication_image_id: string;
  job_id?: string;
  provider: AIProvider;
  model: string;
  model_version?: string;
  embedding_dimension: number;
  embedding?: number[];
  embedding_data?: number[];
  image_hash?: string;
  created_at: string;
  updated_at: string;
};

export type ModerationResult = {
  id: string;
  publication_id?: string;
  publication_image_id?: string;
  job_id?: string;
  provider: AIProvider;
  model: string;
  classification: ModerationClassification;
  confidence: number;
  reason?: string;
  requires_human_review: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  review_decision?: 'APPROVED' | 'REJECTED' | 'MODIFIED';
  created_at: string;
  metadata: Record<string, unknown>;
};

export type MatchType = 'LOST_FOUND' | 'SIGHTING' | 'VISUAL' | 'SEMANTIC';

export type MatchStatus = 'PENDING' | 'NOTIFIED' | 'VIEWED' | 'CONFIRMED' | 'DISMISSED';

export type AIMatch = {
  id: string;
  publication_a_id: string;
  publication_b_id: string;
  match_type: MatchType;
  overall_score: number;
  structured_score?: number;
  text_score?: number;
  semantic_score?: number;
  visual_score?: number;
  provider?: AIProvider;
  model?: string;
  model_version?: string;
  status: MatchStatus;
  notified_at?: string;
  viewed_by_a: boolean;
  viewed_by_b: boolean;
  confirmed_by?: string;
  dismissed_by?: string;
  reasons: string[];
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
};

export type DuplicateDetection = {
  id: string;
  publication_a_id: string;
  publication_b_id: string;
  similarity_score: number;
  same_image_hash: boolean;
  similar_image: boolean;
  same_text: boolean;
  similar_text: boolean;
  same_location: boolean;
  same_date: boolean;
  duplicate_probability: number;
  reviewed: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  is_duplicate?: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
};

// Alias para compatibilidad
export type AIProcessingJob = AIJob;
