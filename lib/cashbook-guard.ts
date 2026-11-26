/* eslint-disable @typescript-eslint/no-explicit-any */
// Server-side rules for manual Cashbook entries (void and reversal).
// Mirrors the client rules in legacy/scripts/00.js (cbCanEdit, cbCanVoid, cbCanReverse, cbReconLocked).
// Only entries flagged manual:true are governed here. Automatic and legacy rows are never
// changed or deleted by these rules, and no existing row may gain the manual flag.
// The save is checked against the stored payload; the route's version check serialises
// concurrent saves, so two reversals cannot both pass the remaining-amount check.

type Row = Record<string, any>;

const num = (v: unknown) => Number(v) || 0;
const list = (p: Row | null | undefined): Row[] => (p && Array.isArray(p.cashbook) ? p.cashbook : []);
const FIELDS = ["amount", "dir", "date", "accountId", "cat", "method", "note", "reversesId"] as const;

function parse(payload: string | null): Row | null {
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

// A completed reconciliation locks entries dated on or before its date for the same account.
function reconLockedBy(next: Row, date: string, accountId: string | null | undefined): Row | null {
  const recons: Row[] = Array.isArray(next.recons) ? next.recons : [];
  return (
    recons.find(
      (r) =>
        String(r.status || "").startsWith("Completed") &&
        typeof r.date === "string" &&
        String(date || "") <= r.date &&
        (!r.accountId || !accountId || r.accountId === accountId),
    ) || null
  );
}

// Returns a user-facing message when the save breaks a manual Cashbook rule, otherwise null.
export function findCashbookViolation(previousPayload: string | null, nextPayload: Row): string | null {
  const prev = parse(previousPayload);
  const prevById = new Map<string, Row>(list(prev).map((e) => [String(e.id), e]));
  const nextRows = list(nextPayload);
  const nextById = new Map<string, Row>(nextRows.map((e) => [String(e.id), e]));

  // Manual entries must not be deleted. Voiding is the only way to remove their effect.
  for (const [id, pe] of prevById) {
    if (pe.manual === true && !nextById.has(id)) {
      return "Manual Cashbook entries cannot be deleted. Void the entry instead.";
    }
  }

  // Active reversals per original, computed from the next state.
  const reversedBy = new Map<string, number>();
  for (const e of nextRows) {
    if (e.reversesId && !e.voided) {
      const key = String(e.reversesId);
      reversedBy.set(key, (reversedBy.get(key) || 0) + num(e.amount));
    }
  }

  for (const e of nextRows) {
    const id = String(e.id);
    const pe = prevById.get(id);

    if (!pe) {
      // New row.
      if (e.voided) return "A new Cashbook entry cannot be created as voided.";
      if (e.manual === true) {
        if (e.reversesId) {
          const target = nextById.get(String(e.reversesId));
          if (!target || target.manual !== true) return "A reversal must link to a manual Cashbook entry.";
          if (target.voided) return "A voided entry cannot be reversed.";
          if (target.reversesId) return "A reversal cannot be reversed. Void it instead.";
          if (target.dir === e.dir) return "A reversal must be the opposite type of the original entry.";
          if (String(e.date) < String(target.date)) return "A reversal cannot be dated before the original entry.";
          if (num(e.amount) <= 0) return "A reversal amount must be above zero.";
          const lock = reconLockedBy(nextPayload, String(e.date), e.accountId) || reconLockedBy(nextPayload, String(target.date), target.accountId);
          if (lock) return `This period is locked by reconciliation ${lock.id}. Reversals cannot be recorded here.`;
        }
      } else if (e.reversesId) {
        return "Only manual Cashbook entries can be reversals.";
      }
      continue;
    }

    // Existing row.
    if (pe.manual !== true && e.manual === true) {
      return "Existing Cashbook entries cannot be marked as manual.";
    }
    if (pe.voided) {
      // A voided entry is final. Its details and void record must stay exactly as they were.
      if (!e.voided || JSON.stringify(e.voided) !== JSON.stringify(pe.voided)) {
        return "A voided Cashbook entry cannot be restored or changed.";
      }
      if (FIELDS.some((f) => JSON.stringify(e[f]) !== JSON.stringify(pe[f]))) {
        return "A voided Cashbook entry cannot be edited.";
      }
      continue;
    }

    if (e.voided && pe.manual === true) {
      const v = e.voided || {};
      if (!String(v.reason || "").trim()) return "A reason is required to void a Cashbook entry.";
      if (!String(v.by || "").trim() || !String(v.at || "").trim()) return "The voiding user and time must be recorded.";
      if (reversedBy.get(id)) return "This entry has a reversal and cannot be voided. Void or review the reversal first.";
      const lock = reconLockedBy(nextPayload, String(e.date), e.accountId);
      if (lock) return `This period is locked by reconciliation ${lock.id}. Voiding is not allowed here.`;
      continue;
    }

    if (pe.manual === true) {
      const changed = FIELDS.some((f) => JSON.stringify(e[f]) !== JSON.stringify(pe[f]));
      if (changed && (pe.reversesId || reversedBy.get(id))) {
        return "This entry has a reversal and cannot be edited. Use a controlled correction instead.";
      }
      if (changed && pe.reversesId) return "A reversal entry cannot be edited.";
    }
  }

  // Reversed total must never exceed the original amount.
  for (const e of nextRows) {
    if (e.manual === true && !e.reversesId && !e.voided) {
      const total = reversedBy.get(String(e.id)) || 0;
      if (total > num(e.amount)) return "Reversals cannot exceed the original amount.";
    }
  }

  return null;
}
