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
  | "settings"
  | "account";

export type ModuleAccess = { key: ModuleKey; label: string; access: readonly Role[] };

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

export function normalizeRole(value: string | null | undefined): Role {
  return (value && LEGACY_ROLES[value.toLowerCase()]) || "cashier";
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export function canAccessModule(role: Role, module: ModuleKey): boolean {
  return MODULES.find((m) => m.key === module)?.access.includes(role) ?? false;
}

export function canRunIntent(role: Role, intent: string): boolean {
  return (INTENT_ACCESS[intent] ?? INTENT_ACCESS.general).includes(role);
}

export const clientRbacPolicy = {
  roles: ROLES,
  labels: ROLE_LABELS,
  modules: MODULES,
  intents: INTENT_ACCESS,
  actions: ACTION_INTENTS,
};
