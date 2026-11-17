const html = `
<div class="page-head"><div><div class="eyebrow">ACCESS CONTROL</div><h1>Team &amp; access</h1><p>Preview how owner and employee access could be organised.</p></div><button class="btn primary" onclick="toast('Adding real users requires authentication and a backend in the MVP.')">＋ Invite teammate</button></div>
<div class="form-note">Demo only: these are example roles, not real user accounts. The prototype does not authenticate users or enforce permissions.</div>
<div class="panel table-panel"><div class="table-wrap"><table><thead><tr><th>Team member</th><th>Role</th><th>Access preview</th><th>Status</th></tr></thead><tbody><tr><td><b>Owner account</b><div class="muted">owner@example.demo</div></td><td>Owner</td><td>All modules · Reports · Team</td><td><span class="badge in-stock">Demo active</span></td></tr><tr><td><b>Shop assistant</b><div class="muted">shop@example.demo</div></td><td>Employee</td><td>Sales · Inventory view</td><td><span class="badge in-stock">Demo active</span></td></tr><tr><td><b>Stock controller</b><div class="muted">stock@example.demo</div></td><td>Employee</td><td>Receiving · Inventory</td><td><span class="badge in-stock">Demo active</span></td></tr></tbody></table></div></div>
`;

export default function TeamPage() {
  return <section id="page-team" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
