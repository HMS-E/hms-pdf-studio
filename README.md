# HMS PDF Studio v1.0 — GitHub Pages

Upload **all files from this folder** into the root of the existing `hms-pdf-studio` repository. Replace files with matching names, and delete old unused files if desired. GitHub Settings > Pages > Deploy from branch > main / root. The site should be served over HTTPS.

## Features
- PDF compression: image-based page reconstruction with multiple quality passes and a target-size attempt (not guaranteed).
- Merge PDF files in the listed order.
- Organize: reorder, delete and rotate pages.
- Edit: add text (including browser-supported Arabic rendering) and cover selected rectangles. Saving **rasterizes all pages**, discarding original text layers and interactive content. This is **not certified secure redaction**. Do not rely on it for legal or security-sensitive redaction.
- Download edited PDF; input is not uploaded to a server.

## Limitations
- PDF.js and pdf-lib are loaded from third-party CDNs. First launch requires Internet. Offline operation may work after these resources have been cached by the service worker, but is not guaranteed on all browsers or after cache eviction.
- PDFs with password protection, unusual encodings, or very large scans may fail or exhaust mobile memory.
- Compression and editing rasterize text; original searchable text, links, forms, and annotations are not preserved.
- The page organizer's thumbnails are schematic after loading; page ordering uses original source indices.
- Arabic text depends on browser fonts; PDF output is rasterized.
- No tests on actual Android devices were performed in this environment.

For stronger offline guarantees, vendor audited local copies of the two JS libraries and worker, and test on both devices.
