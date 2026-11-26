// Salesperson snapshot on sale rows.
// Each sale row stores the POS operator who completed it: soldById (user id) and soldByName
// (display name at the time of sale). The server is the authority: new transactions take the
// signed-in user, and existing transactions keep whatever was recorded when they were first saved.
// Historical rows without a snapshot stay without one. Nothing is invented for them.

type Who = { id: string; name?: string | null; username?: string | null; email?: string | null };

export function salespersonName(u: Who): string {
  return (u.name || "").trim() || (u.username || "").trim() || (u.email || "").trim();
}

function parse(payload: string | null): Record<string, unknown> | null {
  if (!payload) return null;
  try {
    const v = JSON.parse(payload) as unknown;
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

const txnKey = (row: Record<string, unknown>) => String(row.transactionId ?? row.id ?? "");

// Returns the next state with the salesperson fields set on every sale row.
export function stampSalesperson(
  previousPayload: string | null,
  next: Record<string, unknown>,
  who: Who,
): Record<string, unknown> {
  const sales = next.sales;
  if (!Array.isArray(sales)) return next;

  const prev = parse(previousPayload);
  const prevSales = Array.isArray(prev?.sales) ? (prev!.sales as unknown[]) : [];
  const recorded = new Map<string, Record<string, unknown>>();
  for (const row of prevSales) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const key = txnKey(r);
    if (key && !recorded.has(key)) recorded.set(key, r);
  }

  const name = salespersonName(who);
  for (const row of sales) {
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    const old = recorded.get(txnKey(r));
    if (old) {
      // Existing transaction: copy the recorded snapshot back, or leave it absent.
      if (old.soldById !== undefined) r.soldById = old.soldById;
      else delete r.soldById;
      if (old.soldByName !== undefined) r.soldByName = old.soldByName;
      else delete r.soldByName;
    } else {
      // New transaction: the authenticated operator, whatever the client sent.
      r.soldById = who.id;
      if (name) r.soldByName = name;
      else delete r.soldByName;
    }
  }
  return next;
}
