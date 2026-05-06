// AUTO動態貼圖 PWA - TypeScript 類型定義

export type UserRole = 'guest' | 'creator' | 'paid_creator' | 'admin' | 'reviewer';
export type JobStatus = 'draft' | 'validating' | 'queued' | 'uploading' | 'generating' | 'post_processing' | 'completed' | 'failed' | 'cancelled';
export type StickerKind = 'static_png' | 'animated_apng';

export interface User { id: string; email: string; displayName: string; role: UserRole; avatarUrl?: string; createdAt: string; }
export interface Session { id: string; userId: string; tokenHash: string; expiresAt: string; createdAt: string; }
export interface CreditWallet { id: string; userId: string; freeCredits: number; paidCredits: number; updatedAt: string; }
export interface CreditLedger { id: string; userId: string; type: 'grant' | 'debit' | 'refund' | 'purchase'; amount: number; reason: string; jobId?: string; createdAt: string; }
export interface TemplateCategory { id: string; slug: string; name: string; sortOrder: number; }
export interface StickerTemplate { id: string; categoryId: string; name: string; description: string; thumbnailUrl: string; prompt: string; tags: string[]; defaultCount: 4 | 8 | 16; supportsAnimated: boolean; isPremium: boolean; status: 'active' | 'disabled'; }
export interface PromptPreset { id: string; templateId: string; label: string; prompt: string; maxChars: number; tags: string[]; }
export interface SourceAsset { id: string; userId: string; kind: 'portrait' | 'pet' | 'character' | 'brand_mascot'; fileUrl: string; width: number; height: number; mimeType: string; fileSize: number; consent: boolean; qualityScore: number; createdAt: string; deletedAt?: string; }
export interface CropState { id: string; assetId: string; x: number; y: number; width: number; height: number; rotate: number; bgRemoved: boolean; maskUrl?: string; }
export interface StickerProject { id: string; userId: string; title: string; templateId: string; sourceAssetId: string; status: 'draft' | 'in_progress' | 'completed' | 'exported'; count: 4 | 8 | 16; createdAt: string; updatedAt: string; }
export interface GenerateSettings { id: string; projectId: string; removeBackground: boolean; addText: boolean; whiteStroke: boolean; styleStrength: number; language: 'zh-TW' | 'ja' | 'en'; outputKind: StickerKind; }
export interface GenerationJob { id: string; projectId: string; userId: string; templateId: string; prompt: string; status: JobStatus; progress: number; errorCode?: string; errorMessage?: string; provider: 'mock' | 'openai' | 'fal' | 'custom'; createdAt: string; completedAt?: string; }
export interface StickerResult { id: string; jobId: string; projectId: string; index: number; text: string; imageUrl: string; width: number; height: number; fileSize: number; kind: StickerKind; status: 'pending' | 'success' | 'failed'; }
export interface MotionTemplate { id: string; name: string; action: 'blink' | 'nod' | 'shake' | 'bounce' | 'wave' | 'heart' | 'sweat'; frameCount: number; playbackSec: 1 | 2 | 3 | 4; loopCount: 1 | 2 | 3 | 4; riskLevel: 'low' | 'medium' | 'high'; }
export interface LineQcRule { id: string; key: string; label: string; severity: 'P0' | 'P1' | 'P2'; staticLimit?: unknown; animatedLimit?: unknown; }
export interface QcReport { id: string; projectId: string; jobId: string; passed: boolean; failures: QcFailure[]; createdAt: string; }
export interface QcFailure { ruleKey: string; severity: 'P0' | 'P1' | 'P2'; message: string; targetFile?: string; }
export interface ExportPackage { id: string; projectId: string; type: 'png_single' | 'zip_all' | 'line_static_zip' | 'line_animated_zip'; status: 'pending' | 'ready' | 'failed'; fileUrl?: string; manifestUrl?: string; qcReportId: string; createdAt: string; }
export interface PwaInstallEvent { id: string; userId?: string; platform: 'ios' | 'android' | 'desktop'; event: 'prompt_shown' | 'installed' | 'dismissed'; createdAt: string; }
export interface AuditLog { id: string; actorId?: string; action: string; entityType: string; entityId: string; payload: Record<string, unknown>; createdAt: string; }

export interface ApiError { error: { code: string; message: string; details?: Record<string, unknown> }; }
