export const enum EndPoints {
  // ─── Auth ───────────────────────────────────────────────────
  LOGIN    = '/api/auth/login',
  REGISTER = '/api/auth/register',

  // ─── Tenant ────────────────────────────────────────────────────
 TENANTS = '/api/tenants/get_tenants',
  TENANTS_SELECT = '/api/tenants/get_tenants_select',

  // ─── Bot ────────────────────────────────────────────────────
  BOT              = '/api/bot/',
  BOTS_BY_TENANT   = '/api/bot/get_bots_by_tenant/',
  BOTS_BY_TENANT_SELECT   = '/api/bot/get_bots_by_tenant_select/',

  // ─── Chat ───────────────────────────────────────────────────
  CHAT = '/api/chat',

  // ─── Conversations ──────────────────────────────────────────
  CONVERSATIONS         = '/api/conversations',
  CONVERSATIONS_BOT     = '/api/conversations/bot/',
  CONVERSATIONS_SESSION = '/api/conversations/session/',

  // ─── Documents ──────────────────────────────────────────────
  DOCUMENTS = '/api/documents/',

  // ─── Leads ──────────────────────────────────────────────────
  LEADS_BY_BOT = '/api/lead/get_leads_by_bot/',
  LEAD_STATUS  = '/api/lead/update_status/',

  // ─── Users / Advisers ────────────────────────────────────────
  ADVISER_CREATE      = '/api/adviser/adviser/',
  ADVISERS_BY_TENANT  = '/api/adviser/get_advisers_by_tenant/',
  ADVISER_DELETE      = '/api/adviser/',
  USERS = '/api/users',

  // ─── WhatsApp Config ────────────────────────────────────────
  WHATSAPP_CONFIG = '/api/whatsapp-config/',

  // ─── Roles & Permissions ─────────────────────────────────────
  ROLES            = '/api/roles',
  ROLE_PERMISSIONS = '/api/role-permissions/',
}
