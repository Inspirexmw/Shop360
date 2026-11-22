import { asc } from "drizzle-orm";
import { db } from "@/db";
import { customRoles } from "@/db/schema";
import { BUILTIN_ROLE_DEFINITIONS, buildPolicy, type RbacPolicy, type RoleDefinition } from "@/lib/roles";

export type CustomRoleRow = {
  id: string;
  name: string;
  description: string | null;
  modules: string[];
};

// The table is added by db/migrations/0004_custom_roles.sql. Until it is applied
// the app keeps working with the built-in categories only.
export async function listCustomRoles(): Promise<CustomRoleRow[]> {
  try {
    const rows = await db
      .select({
        id: customRoles.id,
        name: customRoles.name,
        description: customRoles.description,
        modules: customRoles.modules,
      })
      .from(customRoles)
      .orderBy(asc(customRoles.name));
    return rows.map((r) => ({ ...r, modules: Array.isArray(r.modules) ? r.modules : [] }));
  } catch (e) {
    console.warn("[roles] custom_roles unavailable, using built-in categories only:", e);
    return [];
  }
}

export async function getRoleDefinitions(): Promise<RoleDefinition[]> {
  const rows = await listCustomRoles();
  return [
    ...BUILTIN_ROLE_DEFINITIONS.map((d) => ({ ...d, modules: [...d.modules] })),
    ...rows.map((r) => ({
      key: r.id,
      label: r.name,
      description: r.description,
      modules: r.modules,
      builtIn: false,
    })),
  ];
}

export async function getRoleKeys(): Promise<string[]> {
  return (await getRoleDefinitions()).map((d) => d.key);
}

export async function getRbacPolicy(): Promise<RbacPolicy> {
  return buildPolicy(await getRoleDefinitions());
}
