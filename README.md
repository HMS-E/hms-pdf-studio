# HMS PDF Studio v1.7 — High-Quality Image Documents

Built from the v1.5 project. Upload these files to the **root** of the existing `HMS-E/hms-pdf-studio` GitHub repository. This keeps the same GitHub Pages URL.

## What changed

- **Save PDF as image-based PDF:** Each original page is rendered into an image and embedded back into a PDF page at its original dimensions. Original text, interactive elements, hyperlinks, and forms are removed by rasterization.
- **PDF → Word (.docx):** Each PDF page becomes one embedded JPEG/PNG image in the Word document, on its own page. No OCR; text is **not** editable or selectable.
- **Word → PDF:** Supports image-only DOCX documents, including Word files made by this version. This is **not** a general-purpose, layout-faithful converter for arbitrary DOCX files.
- **Export PDF pages to ZIP:** Uses the same quality preset, and outputs numbered JPG/PNG images.
- **Quality:** `High` 200 DPI / JPEG 95%, or `Ultra` 300 DPI / lossless PNG. Ultra produces larger documents and needs more device memory.
- Existing compression, PDF merging, page organizing, and PDF editing code is retained unchanged.

## Limitations

- The PDF → DOCX converter sets the Word page size based on the **first** PDF page; later pages with different sizes are fitted proportionally.
- PDFs with huge pages may exceed a phone's available canvas/memory. Switch to the 200 DPI setting if 300 DPI fails.
- The app uses browser-based JS from public CDNs; first load requires internet and reliable offline operation is not guaranteed. Conversion data stays in the browser, not sent to a server by this code.
- This release has had JavaScript syntax and static checks; run real-device/browser checks before relying on important documents.

## Deploy on GitHub Pages

Replace the repository-root files with this package (or copy only the changed files: `index.html`, `word-conversion.js`, `enhancements.js`, `sw.js`, `README.md`). GitHub Pages then serves the updated site after deployment. Refresh the browser or clear the previous page cache if necessary.

## v1.7: Save PDF pages as images
- In Convert PDF, choose PNG (lossless) or JPG (98% quality), and 200 or 300 DPI.
- Export all pages or a range such as `1-3,5`. One page downloads as an image; multiple pages as a ZIP of numbered images.
- This export does not alter the source PDF. Large PDFs at 300 DPI can exceed mobile memory.


## v1.8 — Desktop Print Quality
- Export PDF pages as PNG or JPG at 150 / 300 / 600 / 900 / 1200 DPI.
- The same DPI selection applies to image-only PDF and PDF-to-DOCX exports.
- A4 / Letter / original PDF page size selection for PDF and DOCX outputs; aspect ratio is preserved.
- Memory safety threshold 512 MB / 1 GB / 2 GB per rendered page; processing remains sequential.
- PNG is lossless, but rasterization cannot improve the quality of a low-resolution source.
- At 1200 DPI, a single A4 RGBA canvas may consume ~530 MB before PDF.js/browser overhead; a desktop browser may still run out of memory.
- Note: PNG and JPG exports do not reliably encode physical DPI metadata; use the stated pixel dimensions and set A4 paper size when printing.
