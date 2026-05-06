import seed from '@/data/seed.json';

type AnyRecord = Record<string, any>;
const now = () => new Date().toISOString();
const state = globalThis as typeof globalThis & { __AUTO_STICKER_STATE__?: AnyRecord };
if (!state.__AUTO_STICKER_STATE__) {
  state.__AUTO_STICKER_STATE__ = JSON.parse(JSON.stringify(seed));
}
export const db = state.__AUTO_STICKER_STATE__!;
export const nextId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
export const listTemplates = () => db.templates.filter((t: AnyRecord) => t.status === 'active');
export const getTemplate = (id: string) => db.templates.find((t: AnyRecord) => t.id === id);
export const listProjects = (status?: string | null) => status ? db.projects.filter((p: AnyRecord) => p.status === status) : db.projects;
export const getProject = (id: string) => db.projects.find((p: AnyRecord) => p.id === id);
export const createProject = (input: AnyRecord) => {
  const project = { id: nextId('proj'), userId: 'user_demo_001', title: input.title || '新作品', templateId: input.templateId || 'tpl_001', sourceAssetId: input.sourceAssetId || 'asset_001', status: 'draft', count: input.count || 8, createdAt: now(), updatedAt: now() };
  db.projects.push(project);
  db.generationSettings.push({ id: nextId('gs'), projectId: project.id, removeBackground: true, addText: false, whiteStroke: true, styleStrength: 0.8, language: 'zh-TW', outputKind: 'static_png' });
  return project;
};
export const createAsset = (input: AnyRecord) => {
  const asset = { id: nextId('asset'), userId: input.userId || 'guest', kind: input.kind || 'portrait', fileUrl: `/mock-uploads/${Date.now()}.png`, width: 1024, height: 1024, mimeType: input.mimeType, fileSize: input.fileSize || 1024 * 1024, consent: true, qualityScore: 85, createdAt: now() };
  db.sourceAssets.push(asset); return asset;
};
export const createCrop = (assetId: string, input: AnyRecord = {}) => { const cropState = { id: nextId('crop'), assetId, x: input.x ?? 0, y: input.y ?? 0, width: input.width ?? 1024, height: input.height ?? 1024, rotate: input.rotate ?? 0, bgRemoved: input.bgRemoved ?? false, maskUrl: input.maskUrl, updatedAt: now() }; db.cropStates.push(cropState); return cropState; };
export const createJob = (input: AnyRecord) => {
  const count = input.count || 8; const job = { id: nextId('job'), jobId: '', status: 'completed', progress: 100, estimatedSeconds: Math.round(10 + count * 2), creditCost: count <= 8 ? 1 : 2, projectId: input.projectId, templateId: input.templateId, sourceAssetId: input.sourceAssetId, provider: process.env.AI_PROVIDER || 'mock', createdAt: now(), completedAt: now() }; job.jobId = job.id; db.generationJobs.push(job);
  for (let i=0;i<count;i++) db.stickerResults.push({ id: nextId('sticker'), jobId: job.id, projectId: input.projectId, index: i, text: ['開心','難過','生氣','加油','愛你','哭哭','好棒','呃...'][i%8], imageUrl: `/mock-stickers/${job.id}-${i+1}.png`, width: 370, height: 370, fileSize: 51200, kind: 'static_png', status: 'success', createdAt: now() });
  const project = getProject(input.projectId); if (project) { project.status='completed'; project.updatedAt=now(); }
  return job;
};
export const getJob = (id: string) => db.generationJobs.find((j: AnyRecord) => j.id === id || j.jobId === id);
export const getStickers = (projectId: string) => db.stickerResults.filter((s: AnyRecord) => s.projectId === projectId);
export const runQc = (projectId: string, forceFail = false) => {
  const stickers = getStickers(projectId); const failures = forceFail || stickers.length === 0 ? [{ ruleKey: 'NO_STICKERS', message: '尚無可匯出的貼圖' }] : [];
  const report = { id: nextId('qc'), projectId, jobId: getJob('job_001')?.id || 'job_001', passed: failures.length === 0, failures, warnings: [{ ruleKey: 'REVIEW_NOT_GUARANTEED', message: '本工具不保證LINE審核通過' }], createdAt: now() };
  db.qcReports = db.qcReports.filter((q: AnyRecord) => q.projectId !== projectId); db.qcReports.push(report); return report;
};
export const latestQc = (projectId: string) => [...db.qcReports].reverse().find((q: AnyRecord) => q.projectId === projectId);
export const createExport = (projectId: string) => { const qc = latestQc(projectId); if (!qc || !qc.passed) return null; const pkg = { id: nextId('export'), projectId, type: 'line_static_zip', status: 'ready', fileUrl: `/mock-exports/${projectId}.zip`, manifestUrl: `/mock-exports/${projectId}-manifest.json`, qcReportId: qc.id, createdAt: now() }; db.exportPackages.push(pkg); return pkg; };
export const exportManifest = (id: string) => ({ id, projectId: id.replace(/^export_/, '') || 'w1', type: 'line_static_zip', files: [{ name: 'main.png', size: 51200 }, { name: 'tab.png', size: 5120 }, ...Array.from({ length: 8 }, (_, i) => ({ name: `${String(i + 1).padStart(2, '0')}.png`, size: 51200 })), { name: 'metadata.json', size: 1024 }, { name: 'qc_report.html', size: 2048 }], totalSize: 51200 * 10 + 5120 + 2048, createdAt: now() });
export const modelCount = () => Object.keys(seed).length;
