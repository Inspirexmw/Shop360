const html = `<span class="appName">Shop360</span> prototype · Blank test workspace · Not connected to a live database, payment provider, or shared accounts.`;

export default function FooterNote() {
  return <div className="footer-note" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
