# HMS PDF Studio v1.5 — Hybrid PDF to Word

GitHub Pages ready: upload the contents of this folder to the repository root.

**Conversion modes:**
- Editable text: extracts selectable text into DOCX paragraphs; layout/images may be lost.
- Exact visual pages: embeds rendered PDF pages as JPEG images in DOCX; not editable.
- Hybrid: embeds each page image, followed by extracted text from that page as editable paragraphs. **This does not recreate the original editable layout.**

The conversion runs in the browser. Libraries are loaded from public CDNs on first use; offline behavior is not guaranteed. Scanned PDFs need OCR, which is not implemented. Test with synthetic files; do not upload private documents to GitHub.

Other PDF tools from v1.4 are retained. No real-device end-to-end test has been performed.
