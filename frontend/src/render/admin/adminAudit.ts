export interface AdminAuditLog {
  id: string | number;
  time?: string;
  timestamp?: string | number;
  admin?: string;
  username?: string;
  action?: string;
  details?: string;
}

const AUDIT_KEY = 'sys_core_audit_logs';

export function readAdminAuditLogs(): AdminAuditLog[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(AUDIT_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function recordAdminAction(action: string, details: string, actor?: { username: string; fullName: string }): void {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const logs: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(logs)) return;
    const timestamp = new Date().toISOString();
    const entry: AdminAuditLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp,
      admin: actor?.fullName || sessionStorage.getItem('sys_core_admin_name') || 'Quản trị viên',
      username: actor?.username || sessionStorage.getItem('sys_core_username') || undefined,
      action,
      details,
    };
    localStorage.setItem(AUDIT_KEY, JSON.stringify([entry, ...logs]));
  } catch {
    // The existing operation can still finish if browser storage is unavailable.
  }
}

export function formatAuditTime(log: AdminAuditLog): string {
  if (log.timestamp) {
    const date = new Date(log.timestamp);
    if (!Number.isNaN(date.getTime())) return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour12: false })}`;
  }
  const value = log.time || '';
  const timeFirst = value.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\s*,?\s+(\d{1,2}\/\d{1,2}\/\d{4})$/);
  if (timeFirst) return `${timeFirst[2]} ${timeFirst[1]}`;
  return value.replace(/,\s*/, ' ') || 'Không rõ thời gian';
}

// Ngày theo múi giờ trình duyệt, phù hợp cả bản ghi mới và dữ liệu cũ dạng Việt Nam.
export function auditDate(log: AdminAuditLog): string {
  if (log.timestamp !== undefined) {
    const date = new Date(log.timestamp);
    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  }
  const match = (log.time || '').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : '';
}
