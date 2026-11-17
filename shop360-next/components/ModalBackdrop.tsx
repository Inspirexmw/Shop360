const html = `<div class="modal"><div class="modal-head"><h2 id="modalTitle">New record</h2><button class="close" onclick="closeModal()">✕</button></div><div id="modalBody"></div></div>`;

export default function ModalBackdrop() {
  return <div className="modal-backdrop" id="modalBackdrop" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />;
}
