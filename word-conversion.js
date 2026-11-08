/* HMS PDF Studio v1.6 — high quality, image-based document conversions.
   Each PDF page is rasterized on the device, one at a time.  No OCR or upload. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const DRAW_NS = 'http://schemas.openxmlformats.org/drawingml/2006/main';
  const XML_HEADER = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

  const status = text => { $('status').textContent = text; };
  const xmlEscape = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&apos;'}[c]));
  const sleepFrame = () => new Promise(resolve => setTimeout(resolve, 0));

  function download(data, name, type) {
    const url = URL.createObjectURL(new Blob([data], {type}));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  }

  function choice() {
    const dpi = $('imageQuality').value === '300' ? 300 : 200;
    return {dpi, type: dpi === 300 ? 'png' : 'jpeg', quality: 0.95};
  }

  async function openPdf() {
    const file = $('files').files[0];
    if (!file || !/\.pdf$/i.test(file.name)) {
      throw Error('اختر ملف PDF من مربع رفع الملفات أولاً / Choose a PDF first.');
    }
    if (!window.pdfjsLib) throw Error('PDF.js was not loaded. Check your internet connection.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    const data = new Uint8Array(await file.arrayBuffer());
    return {pdf: await pdfjsLib.getDocument({data}).promise, file};
  }

  async function renderAsImage(page, preset) {
    const vp = page.getViewport({scale: preset.dpi / 72});
    const pixelCount = Math.ceil(vp.width) * Math.ceil(vp.height);
    if (pixelCount > 23000000) {
      throw Error('الصفحة كبيرة جداً لهذا الإعداد. جرّب High Quality 200 DPI. / Page too large; use 200 DPI.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.ceil(vp.width));
    canvas.height = Math.max(1, Math.ceil(vp.height));
    try {
      const ctx = canvas.getContext('2d', {alpha: false});
      if (!ctx) throw Error('Canvas unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({canvasContext: ctx, viewport: vp, background: 'rgb(255,255,255)'}).promise;
      const mime = preset.type === 'png' ? 'image/png' : 'image/jpeg';
      const blob = await new Promise((resolve, reject) => canvas.toBlob(
        result => result ? resolve(result) : reject(Error('Image export failed')), mime, preset.quality
      ));
      return {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        type: preset.type,
        width: canvas.width,
        height: canvas.height,
        points: page.getViewport({scale: 1})
      };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
      if (page.cleanup) page.cleanup();
    }
  }

  async function pageImages(pdf, callback) {
    const preset = choice();
    for (let i = 1; i <= pdf.numPages; i++) {
      status(`Processing ${i} / ${pdf.numPages} · ${preset.dpi} DPI`);
      const page = await pdf.getPage(i);
      const image = await renderAsImage(page, preset);
      await callback(image, i, pdf.numPages);
      await sleepFrame(); // Keep Android's UI responsive between pages.
    }
  }

  function displayResult(name, bytes, label) {
    const result = $('result');
    result.classList.remove('hidden');
    result.replaceChildren();
    const msg = document.createElement('strong');
    msg.textContent = `${label}: ${name} (${(bytes.length / 1048576).toFixed(2)} MB)`;
    result.append(msg);
  }

  async function imagePdf() {
    if (!window.PDFLib) throw Error('pdf-lib is unavailable');
    const {pdf} = await openPdf();
    const output = await PDFLib.PDFDocument.create();
    await pageImages(pdf, async image => {
      const embedded = image.type === 'png'
        ? await output.embedPng(image.bytes)
        : await output.embedJpg(image.bytes);
      const page = output.addPage([image.points.width, image.points.height]);
      page.drawImage(embedded, {x:0, y:0, width:page.getWidth(), height:page.getHeight()});
    });
    const bytes = new Uint8Array(await output.save({useObjectStreams:true}));
    download(bytes, 'HMS_Image_Based_High_Quality.pdf', 'application/pdf');
    displayResult('HMS_Image_Based_High_Quality.pdf', bytes, 'Image-based PDF ready');
  }

  function pictureXml(n, relationship, cx, cy) {
    return `<w:p><w:pPr>${n > 1 ? '<w:pageBreakBefore/>' : ''}<w:spacing w:before="0" w:after="0"/><w:jc w:val="center"/></w:pPr>` +
      `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${n}" name="PDF Page ${n}"/>` +
      `<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic><pic:nvPicPr><pic:cNvPr id="${n}" name="Page ${n}"/><pic:cNvPicPr/></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${relationship}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
      `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`;
  }

  async function pdfToWord() {
    if (!window.JSZip) throw Error('JSZip was not loaded');
    const {pdf} = await openPdf();
    const first = (await pdf.getPage(1)).getViewport({scale:1});
    // Word applies page dimensions per section. Use first-page size and fit other pages inside it.
    const pageW = Math.round(first.width * 20);
    const pageH = Math.round(first.height * 20);
    const marginHorizontal = 500; // 25 PDF points
    const marginVertical = 700;   // 35 PDF points
    const widthAvailable = Math.max(100, first.width - 2 * marginHorizontal / 20);
    const heightAvailable = Math.max(100, first.height - 2 * marginVertical / 20 - 5);

    const zip = new JSZip();
    zip.file('[Content_Types].xml', XML_HEADER +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Default Extension="jpeg" ContentType="image/jpeg"/>' +
      '<Default Extension="jpg" ContentType="image/jpeg"/>' +
      '<Default Extension="png" ContentType="image/png"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>');
    zip.file('_rels/.rels', XML_HEADER +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>');

    const body = [];
    const rels = [];
    await pageImages(pdf, async (image, i) => {
      const ext = image.type === 'png' ? 'png' : 'jpg';
      const fileName = `page-${String(i).padStart(4, '0')}.${ext}`;
      const rel = `rId${i}`;
      zip.file(`word/media/${fileName}`, image.bytes);
      rels.push(`<Relationship Id="${rel}" Type="${REL_NS}/image" Target="media/${fileName}"/>`);
      const ratio = Math.min(widthAvailable / image.points.width, heightAvailable / image.points.height);
      const cx = Math.round(image.points.width * ratio * 12700);
      const cy = Math.round(image.points.height * ratio * 12700);
      body.push(pictureXml(i, rel, cx, cy));
    });

    zip.file('word/_rels/document.xml.rels', XML_HEADER +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      rels.join('') + '</Relationships>');
    zip.file('word/document.xml', XML_HEADER +
      `<w:document xmlns:w="${WORD_NS}" xmlns:r="${REL_NS}" ` +
      'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
      `xmlns:a="${DRAW_NS}" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<w:body>${body.join('')}<w:sectPr><w:pgSz w:w="${pageW}" w:h="${pageH}"/>` +
      `<w:pgMar w:top="${marginVertical}" w:right="${marginHorizontal}" ` +
      `w:bottom="${marginVertical}" w:left="${marginHorizontal}" w:header="0" w:footer="0" w:gutter="0"/>` +
      '</w:sectPr></w:body></w:document>');
    const bytes = new Uint8Array(await zip.generateAsync({type:'uint8array', compression:'DEFLATE'}));
    download(bytes, 'HMS_PDF_Pages_As_Images.docx', DOCX_TYPE);
    displayResult('HMS_PDF_Pages_As_Images.docx', bytes, 'Image-only Word ready');
  }

  async function wordToPdf() {
    // This is a faithful round-trip for image-only DOCX files generated by HMS.
    // It cannot faithfully render arbitrary Word layouts: browsers lack MS Word's layout engine.
    if (!window.JSZip || !window.PDFLib) throw Error('Required libraries are unavailable');
    const input = $('wordInput').files[0];
    if (!input) throw Error('اختر ملف Word أولاً / Choose a Word file first.');
    const zip = await JSZip.loadAsync(await input.arrayBuffer());
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw Error('Invalid DOCX file');
    const parse = text => {
      const doc = new DOMParser().parseFromString(text, 'application/xml');
      if (doc.getElementsByTagName('parsererror').length) throw Error('Invalid Word XML');
      return doc;
    };
    const xml = parse(await xmlFile.async('string'));
    const relationshipFile = zip.file('word/_rels/document.xml.rels');
    if (!relationshipFile) throw Error('This Word file does not contain image relationships.');
    const relDoc = parse(await relationshipFile.async('string'));
    const relMap = new Map();
    for (const rel of Array.from(relDoc.getElementsByTagName('Relationship'))) {
      const target = rel.getAttribute('Target') || '';
      if (/^media\/[\w.\-]+\.(png|jpe?g)$/i.test(target)) relMap.set(rel.getAttribute('Id'), 'word/' + target);
    }
    const nonImageText = Array.from(xml.getElementsByTagNameNS(WORD_NS, 't'))
      .some(node => node.textContent.trim());
    if (nonImageText) {
      throw Error('This Word file contains text. Converting it as images here would lose content. Use an image-only DOCX generated by HMS.');
    }
    const blips = Array.from(xml.getElementsByTagNameNS(DRAW_NS, 'blip'));
    if (!blips.length) {
      throw Error('This DOCX has no embedded page images. Image-only Word → PDF supports documents with page images.');
    }
    const result = await PDFLib.PDFDocument.create();
    const pageSize = xml.getElementsByTagNameNS(WORD_NS, 'pgSz')[0];
    const pageW = pageSize ? Number(pageSize.getAttributeNS(WORD_NS, 'w')) / 20 : 595.28;
    const pageH = pageSize ? Number(pageSize.getAttributeNS(WORD_NS, 'h')) / 20 : 841.89;
    const W = pageW > 150 && pageW < 2500 ? pageW : 595.28;
    const H = pageH > 150 && pageH < 2500 ? pageH : 841.89;
    for (let i = 0; i < blips.length; i++) {
      status(`Processing Word image ${i + 1} / ${blips.length}`);
      const relationship = blips[i].getAttributeNS(REL_NS, 'embed');
      const path = relMap.get(relationship);
      if (!path || !zip.file(path)) throw Error(`Missing embedded Word image ${i + 1}`);
      const bytes = new Uint8Array(await zip.file(path).async('uint8array'));
      const image = /\.png$/i.test(path) ? await result.embedPng(bytes) : await result.embedJpg(bytes);
      const p = result.addPage([W, H]);
      const scale = Math.min(W / image.width, H / image.height);
      const width = image.width * scale, height = image.height * scale;
      p.drawImage(image, {x:(W-width)/2, y:(H-height)/2, width, height});
      await sleepFrame();
    }
    const bytes = new Uint8Array(await result.save());
    download(bytes, 'HMS_Word_Images_To_PDF.pdf', 'application/pdf');
    displayResult('HMS_Word_Images_To_PDF.pdf', bytes, 'Image-based PDF ready');
  }

  function directionUI() {
    const toWord = $('wordDirection').value === 'pdf-docx';
    $('wordInput').closest('label').style.display = toWord ? 'none' : 'block';
    $('saveImagePdfBtn').style.display = toWord ? 'inline-block' : 'none';
    $('wordHint').textContent = toWord
      ? 'Every PDF page becomes a high-quality image INSIDE the DOCX. Text is not editable or selectable. / كل صفحة تصبح صورة داخل Word، والنص غير قابل للتعديل.'
      : 'Image-only DOCX files (including those created here) can be turned back into image-based PDF. Complex Word layouts are not supported. / يدعم ملفات Word المكونة من صور الصفحات.';
  }

  async function run(button, job) {
    if (button.disabled) return;
    button.disabled = true;
    $('result').classList.add('hidden');
    try { await job(); status('Completed / اكتمل'); }
    catch (err) { console.error(err); status('Error / خطأ'); alert(err.message || String(err)); }
    finally { button.disabled = false; }
  }

  $('wordMode').value = 'image';
  $('wordDirection').addEventListener('change', directionUI);
  directionUI();
  $('wordConvertBtn').onclick = () => run($('wordConvertBtn'),
    $('wordDirection').value === 'pdf-docx' ? pdfToWord : wordToPdf);
  $('saveImagePdfBtn').onclick = () => run($('saveImagePdfBtn'), imagePdf);

  // Reuse the same image quality and rasterizing path for the existing ZIP export tool.
  window.HMSImageMode = {openPdf, renderAsImage, choice, pageImages, download};
})();
