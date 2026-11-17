const html = `
<div class="page-head settings-page-head"><div><div class="eyebrow">BUSINESS CONFIGURATION</div><h1>Settings</h1><p>Manage how your business operates and how Shop360 looks and behaves.</p></div><span class="settings-status"><i></i> Local test configuration</span></div>
<div class="settings-profile panel">
<div class="settings-profile-mark" id="settingsBusinessMark">S</div>
<div class="settings-profile-copy"><div class="settings-overline">BUSINESS PROFILE</div><h2 id="settingsBusinessName">Your business</h2><p id="settingsBusinessMeta">Add a business phone number · Add your business address</p></div>
<button class="btn secondary" onclick="openSettingsDetails()">Edit business profile <span>→</span></button>
</div>
<div class="settings-section-head"><div><h2>Business setup</h2><p>Core details used throughout sales, stock and customer records.</p></div></div>
<div class="settings-grid">
<button class="settings-card" onclick="openSettingsDetails()"><span class="settings-card-icon sage">▤</span><span class="settings-card-copy"><b>Business profile</b><small>Business name, type, contact details, address and TIN.</small><em>Configure profile <span>→</span></em></span></button>
<button class="settings-card" onclick="openSettingsDetails()"><span class="settings-card-icon blue">▣</span><span class="settings-card-copy"><b>Receipts &amp; tax</b><small>Receipt identity, VAT settings and lay-by deposit requirements.</small><em>Configure receipts <span>→</span></em></span></button>
<button class="settings-card" onclick="openTemplates()"><span class="settings-card-icon violet">▦</span><span class="settings-card-copy"><b>Product setup</b><small>Starter templates, categories and product types for your retail business.</small><em>Manage product setup <span>→</span></em></span></button>
</div>
<div class="settings-section-head"><div><h2>Workspace preferences</h2><p>Manage your business branding and operational notifications.</p></div></div>
<div class="settings-grid">
<button class="settings-card" onclick="openAppearance()"><span class="settings-card-icon amber">✳</span><span class="settings-card-copy"><b>Appearance</b><small>Upload or remove your business logo.</small><em>Customise workspace <span>→</span></em></span></button>
<button class="settings-card" onclick="openAlertSettings()"><span class="settings-card-icon rose">♧</span><span class="settings-card-copy"><b>Alerts &amp; notifications</b><small>Low-stock thresholds, lay-by reminders, order delays and margin alerts.</small><em>Manage alerts <span>→</span></em></span></button>
<button class="settings-card" onclick="navigate('team')"><span class="settings-card-icon teal">♙</span><span class="settings-card-copy"><b>Team &amp; access</b><small>Review the owner and employee access model for this prototype.</small><em>View team access <span>→</span></em></span></button>
</div>
<div class="settings-section-head"><div><h2>Data &amp; maintenance</h2><p>Protect your records and manage the data stored in this browser.</p></div></div>
<div class="settings-data-panel panel"><div class="settings-data-copy"><span class="settings-card-icon blue">↥</span><div><b>Backup &amp; restore</b><p>Download a copy of your business data, restore a previous backup or export records for accounting.</p></div></div><button class="btn primary" onclick="openBackup()">Open backup &amp; restore <span>→</span></button></div>
<div class="settings-demo-note"><b>About this prototype</b><span>Settings and records are saved in this browser only. Team authentication, cloud synchronisation and multi-device access require the production backend. Download regular backups to protect demo data.</span></div>
`;

export default function SettingsPage() {
  return <section id="page-settings" className="page hidden" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
