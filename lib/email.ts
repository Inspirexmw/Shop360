import { normalizeRole, ROLE_LABELS } from "@/lib/roles";

const RESEND_API_URL = "https://api.resend.com/emails";

export type EmailResult =
  | { sent: true; id: string }
  | { sent: false; reason: "not_configured" | "failed"; error?: string };

export type AccountCreatedInput = {
  name: string;
  email: string;
  password: string;
  role: string;
  createdBy: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

function signInUrl() {
  const base = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  return base ? `${base}/` : "";
}

function buildAccountCreatedEmail(input: AccountCreatedInput) {
  const name = input.name.trim();
  const role = ROLE_LABELS[normalizeRole(input.role)];
  const owner = input.createdBy.trim() || "your business owner";
  const url = signInUrl();
  const subject = "Your Shop360 account is ready";

  const text = [
    `Hi ${name},`,
    "",
    `${owner} has created a Shop360 account for you.`,
    "",
    `Email: ${input.email}`,
    `Password: ${input.password}`,
    `Role: ${role}`,
    "",
    url ? `Sign in here: ${url}` : "Sign in to Shop360 with the email and password above.",
    "",
    "Please change your password under My Account after your first sign-in.",
    "",
    "Shop360",
  ].join("\n");

  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#1e2b25;line-height:1.5">
    <h1 style="font-size:20px;margin:0 0 16px">Your Shop360 account is ready</h1>
    <p>Hi ${escapeHtml(name)},</p>
    <p>${escapeHtml(owner)} has created a Shop360 account for you. Use the details below to sign in.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
      <tr><td style="padding:8px 0;color:#66736d">Email</td><td style="padding:8px 0"><b>${escapeHtml(input.email)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#66736d">Password</td><td style="padding:8px 0"><b>${escapeHtml(input.password)}</b></td></tr>
      <tr><td style="padding:8px 0;color:#66736d">Role</td><td style="padding:8px 0">${escapeHtml(role)}</td></tr>
    </table>
    ${url ? `<p><a href="${escapeHtml(url)}" style="background:#176b57;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;display:inline-block">Sign in to Shop360</a></p>` : ""}
    <p style="font-size:12px;color:#66736d">Change your password under My Account after your first sign-in. If you were not expecting this account, contact ${escapeHtml(owner)}.</p>
    <p style="font-size:12px;color:#66736d">Shop360</p>
  </div>`;

  return { subject, text, html };
}

// Non-blocking: account creation succeeds even when email is unconfigured or Resend fails.
export async function sendAccountCreatedEmail(input: AccountCreatedInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info("[email] RESEND_API_KEY is not set; skipping account-created email.");
    return { sent: false, reason: "not_configured" };
  }

  const { subject, text, html } = buildAccountCreatedEmail(input);
  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Shop360 <onboarding@resend.dev>",
        to: [input.email],
        subject,
        text,
        html,
        tags: [{ name: "category", value: "account_created" }],
      }),
    });

    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) {
      console.error("[email] Resend rejected account-created email:", response.status, data.message || data);
      return { sent: false, reason: "failed", error: data.message || "Resend request failed" };
    }
    return { sent: true, id: String(data.id ?? "") };
  } catch (e) {
    console.error("[email] Failed to send account-created email:", e);
    return { sent: false, reason: "failed", error: e instanceof Error ? e.message : "Send failed" };
  }
}
