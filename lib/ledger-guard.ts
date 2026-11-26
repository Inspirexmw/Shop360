/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-side money guard. Mirrors the client ledger in legacy/scripts/00.js (cashAll, cbMirrored)
// and the account helpers in legacy/scripts/04.js (accOfMethod, accGroup, accActive).
// Keep the two in step. The guard rejects a save that leaves an account below zero AND lowers
// that account's balance, so historical negatives are left alone and only new spending is blocked.

type Row = Record<string, any>;
type Entry = { aid: string | null; in: number; out: number };

const num = (v: unknown) => Number(v) || 0;
const round = (v: unknown) => Math.round(num(v));

function accountsOf(p: Row): Row[] {
  return Array.isArray(p.accounts) ? p.accounts : [];
}
function isLayby(a: Row) {
  return String(a.name || "").trim().toLowerCase() === "lay-by";
}
function visibleAccounts(p: Row) {
  return accountsOf(p).filter((a) => !isLayby(a));
}
function byId(p: Row, id: string | null | undefined): Row | null {
  return id ? accountsOf(p).find((a) => a.id === id) || null : null;
}
function isActive(p: Row, a: Row | null): boolean {
  if (!a || a.active === false) return false;
  if (!a.parentId) return true;
  const parent = byId(p, a.parentId);
  return !!parent && parent.active !== false;
}
function accountOfMethod(p: Row, m: string): Row | null {
  if (m === "Lay-by") return null;
  const list = visibleAccounts(p).filter((a) => (a.methods || []).includes(m));
  return list.find((a) => isActive(p, a)) || list[0] || visibleAccounts(p).find((a) => a.name === m) || null;
}
function accountIdFor(p: Row, tgt: Row | null | undefined, method: string): string | null {
  return (tgt && tgt.accountId) || accountOfMethod(p, method)?.id || null;
}

// Cash that a sale group actually put into the till (client: cashAll, sales block).
function saleCash(f: Row): number {
  const base = f.cashReceived != null ? num(f.cashReceived) : num(f.paid) - num(f.storeCreditUsed);
  return Math.max(0, base - num(f.exchangeOffset));
}

// Client: cbMirrored. A cashbook row that copies a record the ledger already counts is skipped.
function isMirrored(p: Row, e: Row): boolean {
  const c = String(e.customerCollectionId || "");
  if (!c) return false;
  if (c.startsWith("CC-SALE-")) {
    const f = (p.sales || []).find((x: Row) => (x.transactionId || x.id) === c.slice(8));
    if (f && f.paymentMethod === "Lay-by") return true;
    if (!f || f.paymentMethod === "Customer store credit") return false;
    return saleCash(f) > 0;
  }
  if (c.startsWith("CC-PAY-")) {
    const pid = c.slice(7);
    return (p.payments || []).some((x: Row) => x.id === pid && x.method !== "Customer store credit" && !x.storeCreditUsed);
  }
  const m = c.match(/^CC-LAY-(.+)-(\d+)$/);
  if (m) {
    const l = (p.layaways || []).find((x: Row) => x.id === m[1]);
    return !!l && (l.payments || []).some((x: Row) => +x.amount === +e.amount && x.method === e.method && x.date === e.date);
  }
  return false;
}

function ledger(p: Row): Entry[] {
  const out: Entry[] = [];
  const push = (pm: string, tgt: Row | null, inAmt: number, outAmt: number) =>
    out.push({ aid: accountIdFor(p, tgt, pm), in: inAmt, out: outAmt });

  // Sales, grouped by transaction. Lay-by and store-credit sales do not put cash in an account.
  const groups = new Map<string, Row[]>();
  (p.sales || []).forEach((x: Row) => {
    const t = String(x.transactionId || x.id);
    groups.set(t, [...(groups.get(t) || []), x]);
  });
  groups.forEach((rows) => {
    const f = rows[0];
    if (f.paymentMethod === "Lay-by" || f.paymentMethod === "Customer store credit") return;
    const a = saleCash(f);
    if (a > 0) push(f.depositMethod || f.paymentMethod || "Cash", f, a, 0);
  });

  (p.payments || [])
    .filter((x: Row) => x.method !== "Customer store credit" && !x.storeCreditUsed)
    .forEach((x: Row) => push(x.method, x, num(x.amount), 0));

  (p.layaways || []).forEach((l: Row) => {
    (l.payments || []).forEach((x: Row) => push(x.method, x, num(x.amount), 0));
    const r = l.refund;
    if (r && !r.cashbookId && num(r.amount) > 0 && num(r.cashAmount ?? r.amount) > 0) {
      push(r.method, r, 0, num(r.cashAmount ?? r.amount));
    }
    (l.adjustments || [])
      .filter((a: Row) => a.type === "refund" && num(a.amount) > 0 && num(a.cashAmount ?? a.amount) > 0)
      .forEach((a: Row) => push(a.method, a, 0, num(a.cashAmount ?? a.amount)));
  });

  (p.refunds || []).forEach((r: Row) => {
    if (num(r.cashOut) > 0) push(r.method, r, 0, num(r.cashOut));
  });

  (p.cashbook || [])
    .filter((e: Row) => !e.voided && !isMirrored(p, e))
    .forEach((e: Row) => push(e.method, e, e.dir === "in" ? num(e.amount) : 0, e.dir === "out" ? num(e.amount) : 0));

  // Opening balances are rows on their account, not on a payment method.
  accountsOf(p)
    .filter((a) => round(a.openingBalance) !== 0)
    .forEach((a) => {
      const v = round(a.openingBalance);
      out.push({ aid: a.id, in: v > 0 ? v : 0, out: v < 0 ? -v : 0 });
    });
  return out;
}

// Balance of every account, with channels rolled into their bank (client: balanceAt / accGroup).
function balancesByAccount(p: Row): Map<string, number> {
  const rows = ledger(p);
  const result = new Map<string, number>();
  accountsOf(p).forEach((a) => {
    const group = new Set<string>([a.id, ...accountsOf(p).filter((c) => c.parentId === a.id).map((c) => c.id)]);
    let total = 0;
    rows.forEach((r) => {
      if (r.aid && group.has(r.aid)) total += r.in - r.out;
    });
    result.set(a.id, total);
  });
  return result;
}

export type FundsProblem = { accountId: string; accountName: string; balance: number };

// Returns the first account a save would push below zero, or null when the save is allowed.
export function findInsufficientFunds(previousPayload: string | null, nextPayload: Row): FundsProblem | null {
  let prev: Row | null = null;
  if (previousPayload) {
    try {
      prev = JSON.parse(previousPayload);
    } catch {
      prev = null;
    }
  }
  const before = prev ? balancesByAccount(prev) : new Map<string, number>();
  const after = balancesByAccount(nextPayload);
  for (const a of accountsOf(nextPayload)) {
    const nb = after.get(a.id) || 0;
    const ob = before.get(a.id) || 0;
    if (nb < 0 && nb < ob) {
      return { accountId: a.id, accountName: String(a.name || ""), balance: nb };
    }
  }
  return null;
}
