# HMS PDF Studio — prototype 0.1

Arabic-first PWA prototype for Android and Windows. Features: load PDF, merge PDF files, delete full pages, overlay English text, visually cover a rectangular region, and export edited PDF. All user PDF bytes are processed in the browser.

## Run

From this directory: `python -m http.server 8000`, then open `http://localhost:8000` in Chrome or Edge. An internet connection is required on first launch to load pdf-lib from jsDelivr. Later launches can work offline if the browser successfully caches that library. For installing on Android, deploy to HTTPS or run on a trusted local origin.

## Limitations / safety

- **White rectangles are NOT secure redaction.** Underlying content may remain extractable. Do not use this feature to remove confidential data.
- Adding Arabic text and true PDF content editing are not implemented.
- PDF compression is not yet implemented; it requires a suitable compression engine and testing.
- The page picker lists page numbers and sizes, not rendered previews.
- The pdf-lib library is currently loaded from a CDN and therefore this package is not fully self-contained for first launch.
- No uploaded personal PDF files were used for testing.
