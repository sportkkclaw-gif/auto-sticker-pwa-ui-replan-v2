export const WORK_RETENTION_DAYS = 30;
export const WORK_RETENTION_COPY = `作品頁與圖片下載保留 ${WORK_RETENTION_DAYS} 天，請完成後先下載到手機。`;

export function workExpiresAt(createdAt: string) {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return null;
  created.setDate(created.getDate() + WORK_RETENTION_DAYS);
  return created;
}

export function isWorkExpired(createdAt: string, now = new Date()) {
  const expiresAt = workExpiresAt(createdAt);
  return Boolean(expiresAt && expiresAt.getTime() <= now.getTime());
}
