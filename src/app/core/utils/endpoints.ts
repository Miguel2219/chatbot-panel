export const enum EndPoints {
  // ─── Auth ───────────────────────────────────────────────────
  LOGIN    = '/api/auth/login',
  REGISTER = '/api/auth/register',
  CHANGE_PASSWORD = '/api/auth/change_password',
  REFRESH  = '/api/auth/refresh',
  LOGOUT   = '/api/auth/logout',
  FORGOT_PASSWORD      = '/api/auth/forgot-password',
  RESET_PASSWORD       = '/api/auth/reset-password',
  VALIDATE_RESET_TOKEN = '/api/auth/reset-password/validate',

  // ─── Tenant ────────────────────────────────────────────────────
  TENANTS = '/api/tenants/get_tenants',
  TENANTS_SELECT = '/api/tenants/get_tenants_select',
  TENANT_CREATE = '/api/tenants',
  TENANT_UPDATE = '/api/tenants/',
  TENANT_USERS  = '/api/tenants/',

  // ─── Bot ────────────────────────────────────────────────────
  BOT              = '/api/bot/',
  BOTS_BY_TENANT   = '/api/bot/get_bots_by_tenant/',
  BOTS_BY_TENANT_SELECT   = '/api/bot/get_bots_by_tenant_select/',

  // ─── Chat ───────────────────────────────────────────────────
  CHAT = '/api/chat',

  // ─── Conversations ──────────────────────────────────────────
  CONVERSATIONS = '/api/conversations',

  // ─── Inbox (Human Handoff) ──────────────────────────────────
  INBOX_BASE    = '/api/inbox',
  INBOX_PENDING = '/api/inbox/pending',
  INBOX_MINE    = '/api/inbox/mine',
  INBOX_STREAM  = '/api/inbox/stream',

  // ─── Documents ──────────────────────────────────────────────
  DOCUMENTS        = '/api/documents',
  DOCUMENT_UPLOAD  = '/api/documents/',
  DOCUMENT_DELETE  = '/api/documents/',

  // ─── Leads ──────────────────────────────────────────────────
  LEADS        = '/api/lead',

  // ─── Users ──────────────────────────────────────────────────
  USERS = '/api/users',
  USERS_WITHOUT_TENANT = '/api/users/without_tenant',

  // ─── WhatsApp Config ────────────────────────────────────────
  WHATSAPP_CONFIG = '/api/whatsapp-config/',

  // ─── Roles & Permissions ─────────────────────────────────────
  ROLES            = '/api/roles',
  ROLE_PERMISSIONS = '/api/role-permissions/',

  // ─── Dashboard ──────────────────────────────────────────────
  DASHBOARD_SUMMARY = '/api/dashboard/summary',

  // ─── Quotas (ADMIN) ─────────────────────────────────────────
  QUOTA_ADMIN_ALL = '/api/quota/admin/all',
}
