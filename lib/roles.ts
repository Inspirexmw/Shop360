// Single source of truth for Shop360 role-based access control.
// Role keys are stored in users.role; "finance" is the canonical name for finance/accounts staff.

export const ROLES = ["owner", "manager", "cashier", "finance"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner / Admin",
  manager: "Manager",
  cashier: "Cashier",
  finance: "Finance",
};

export type ModuleKey =
  | "dashboard"
  | "pos"
  | "inventory"
  | "sales"
  | "daily"
  | "receiving"
  | "orders"
  | "suppliers"
  | "customers"
  | "layaway"
  | "finance"
  | "reports"
  | "team"
  | "audit"
  | "settings"
  | "account";

export type ModuleAccess = { key: ModuleKey; label: string; access: readonly Role[] };

export type RoleDefinition = {
  key: string;
  label: string;
  description?: string | null;
  modules: string[];
  builtIn: boolean;
};

export type RbacPolicy = {
  roles: string[];
  labels: Record<string, string>;
  modules: { key: ModuleKey; label: string; access: string[] }[];
  intents: Record<string, string[]>;
  actions: Record<string, string>;
};

// Which write intents each module grants. Derived policies use this so a custom
// category's selected modules directly determine what its members can do.
export const MODULE_INTENTS: Record<ModuleKey, string[]> = {
  dashboard: ["general"],
  pos: ["sales"],
  inventory: ["inventory"],
  sales: ["sales"],
  daily: ["reports"],
  receiving: ["inventory"],
  orders: ["orders"],
  suppliers: ["orders"],
  customers: ["sales"],
  layaway: ["sales"],
  finance: ["finance"],
  reports: ["reports"],
  team: ["users"],
  audit: ["audit"],
  settings: ["settings"],
  account: ["general"],
};

// System modules that can never be granted through a custom access category.
export const OWNER_ONLY_MODULES: readonly ModuleKey[] = ["audit"];

export const MODULES: readonly ModuleAccess[] = [
  { key: "dashboard", label: "Dashboard", access: ROLES },
  { key: "pos", label: "Point of Sale", access: ["owner", "manager", "cashier"] },
  { key: "inventory", label: "Inventory", access: ["owner", "manager"] },
  { key: "sales", label: "Sales & orders", access: ["owner", "manager", "cashier"] },
  { key: "daily", label: "Daily sales", access: ["owner", "manager", "finance"] },
  { key: "receiving", label: "Stock log", access: ["owner", "manager"] },
  { key: "orders", label: "Stock orders", access: ["owner", "manager"] },
  { key: "suppliers", label: "Suppliers", access: ["owner", "manager"] },
  { key: "customers", label: "Customers", access: ["owner", "manager", "cashier"] },
  { key: "layaway", label: "Lay-by", access: ["owner", "manager", "cashier"] },
  {
    key: "finance",
    label: "Finance (cashbook, expenses, reconciliation, transfers)",
    access: ["owner", "finance"],
  },
  { key: "reports", label: "Reports", access: ["owner", "manager", "finance"] },
  { key: "team", label: "Team & access", access: ["owner"] },
  { key: "audit", label: "Audit trail", access: ["owner"] },
  { key: "settings", label: "Settings", access: ["owner"] },
  { key: "account", label: "My Account", access: ROLES },
];

// Privileged write intents sent by the client with each state save.
export const INTENT_ACCESS: Record<string, readonly Role[]> = {
  general: ROLES,
  sales: ["owner", "manager", "cashier"],
  inventory: ["owner", "manager"],
  orders: ["owner", "manager"],
  finance: ["owner", "finance"],
  reports: ["owner", "manager", "finance"],
  settings: ["owner"],
  users: ["owner"],
  audit: ["owner"],
  data: ["owner"],
};

// Legacy onclick/onsubmit function names mapped to the intent they perform.
export const ACTION_INTENTS: Record<string, string> = {
  resetDemo: "data",
  clearTransactions: "data",
  clearInventory: "data",
  wipeInventory: "data",
  openBackup: "data",
  applyBackup: "data",
  importBackup: "data",
  restoreSnap: "data",
  openSettingsDetails: "settings",
  saveSettings: "settings",
  openAccounts: "settings",
  saveAccount: "settings",
  accToggle: "settings",
  openAppearance: "settings",
  thSave: "settings",
  saveAlertSettings: "settings",
  toggleCompactNumbers: "settings",
  openTeamMemberForm: "users",
  saveTeamMember: "users",
  toggleTeamMember: "users",
  setTeamRole: "users",
  openRoleForm: "users",
  saveRole: "users",
  deleteRole: "users",
  renderAuditRows: "audit",
  refreshAudit: "audit",
  viewAuditEntry: "audit",
  openModal: "inventory",
  saveProduct: "inventory",
  saveAdjust: "inventory",
  saveReceive: "inventory",
  startStocktake: "inventory",
  postStocktake: "inventory",
  applyImport: "inventory",
  openOrder: "orders",
  saveOrder: "orders",
  delOrder: "orders",
  saveSupplier: "orders",
  delSupplier: "orders",
  approveRecon: "finance",
  confirmReconApproval: "finance",
  saveRecon: "finance",
  saveAccountTransfer: "finance",
  delCashEntry: "finance",
  openPay: "sales",
  savePay: "sales",
  openRefund: "sales",
  saveRefund: "sales",
  openExchange: "sales",
  completeExchange: "sales",
  saveWalletTopUp: "sales",
  commitWalletWithdrawal: "sales",
  checkoutPos: "sales",
  savePosLayby: "sales",
  saveLayPay: "sales",
  saveCancelLay: "sales",
};

const LEGACY_ROLES: Record<string, Role> = {
  owner: "owner",
  admin: "owner",
  manager: "manager",
  cashier: "cashier",
  finance: "finance",
  accounts: "finance",
  employee: "cashier",
};

// Custom category keys are stored verbatim in users.role. Unknown values fall back
// to cashier, but only after legacy aliases have been checked.
export function normalizeRole(value: string | null | undefined, known: readonly string[] = ROLES): string {
  const v = value ? String(value).trim() : "";
  if (v && known.includes(v)) return v;
  const alias = v ? LEGACY_ROLES[v.toLowerCase()] : undefined;
  if (alias && known.includes(alias)) return alias;
  return "cashier";
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function isRoleKey(value: unknown, known: readonly string[] = ROLES): boolean {
  return typeof value === "string" && known.includes(value);
}

export function canAccessModule(role: string, module: ModuleKey, defs?: readonly RoleDefinition[]): boolean {
  if (!defs) return MODULES.find((m) => m.key === module)?.access.includes(role as Role) ?? false;
  return defs.some((d) => d.key === role && d.modules.includes(module));
}

export function intentsForModules(modules: readonly string[]): string[] {
  const out = new Set<string>(["general"]);
  for (const mod of modules) {
    for (const intent of MODULE_INTENTS[mod as ModuleKey] ?? []) {
      if (intent !== "data") out.add(intent);
    }
  }
  return [...out];
}

export const BUILTIN_ROLE_DEFINITIONS: readonly RoleDefinition[] = ROLES.map((role) => ({
  key: role,
  label: ROLE_LABELS[role],
  modules: MODULES.filter((m) => m.access.includes(role)).map((m) => m.key),
  builtIn: true,
}));

// Produces the exact policy shape the legacy UI already understands, but with
// module/intent access derived from the current set of role definitions.
export function buildPolicy(defs: readonly RoleDefinition[]): RbacPolicy {
  const roles = defs.map((d) => d.key);
  const labels: Record<string, string> = {};
  const collected: Record<string, Set<string>> = {};

  const add = (intent: string, role: string) => {
    (collected[intent] ||= new Set()).add(role);
  };

  for (const def of defs) {
    labels[def.key] = def.label;
    const intents = def.builtIn
      ? Object.keys(INTENT_ACCESS).filter((intent) => INTENT_ACCESS[intent].includes(def.key as Role))
      : intentsForModules(def.modules);
    intents.forEach((intent) => add(intent, def.key));
  }

  (collected.general ||= new Set());
  roles.forEach((role) => collected.general.add(role));
  collected.data = new Set(["owner"]);
  collected.audit = new Set(["owner"]);
  Object.keys(INTENT_ACCESS).forEach((intent) => {
    (collected[intent] ||= new Set());
  });

  const intents: Record<string, string[]> = {};
  Object.keys(collected).forEach((intent) => {
    intents[intent] = [...collected[intent]];
  });

  const modules = MODULES.map((m) => ({
    key: m.key,
    label: m.label,
    access: OWNER_ONLY_MODULES.includes(m.key)
      ? defs.filter((d) => d.builtIn && d.key === "owner" && d.modules.includes(m.key)).map((d) => d.key)
      : defs.filter((d) => d.modules.includes(m.key)).map((d) => d.key),
  }));

  return { roles, labels, modules, intents, actions: ACTION_INTENTS };
}

export function canRunIntent(role: string, intent: string, defs?: readonly RoleDefinition[]): boolean {
  const intents: Record<string, readonly string[]> = defs ? buildPolicy(defs).intents : INTENT_ACCESS;
  return (intents[intent] ?? intents.general ?? []).includes(role);
}

export const clientRbacPolicy = buildPolicy(BUILTIN_ROLE_DEFINITIONS);
