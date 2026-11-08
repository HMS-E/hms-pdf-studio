/* HMS PDF Studio enhancements v1.6: preview zoom + high quality ZIP images */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  let zoom = 1;
  const canvas = $('preview');
  function setZoom(value) {
    zoom = Math.max(0.5, Math.min(3, value));
    canvas.style.width = `${zoom * 100}%`;
    canvas.style.maxWidth = 'none';
    $('zoomValue').textContent = `${Math.round(zoom * 100)}%`;
  }
  $('zoomIn').onclick = () => setZoom(zoom + 0.25);
  $('zoomOut').onclick = () => setZoom(zoom - 0.25);
  $('zoomReset').onclick = () => setZoom(1);
  setZoom(1);

  $('exportImages').onclick = async () => {
    const button = $('exportImages');
    if (button.disabled) return;
    button.disabled = true;
    try {
      if (!window.JSZip || !window.HMSImageMode) throw Error('Required PDF/image libraries are unavailable');
      const {pdf} = await HMSImageMode.openPdf();
      const zip = new JSZip();
      const quality = HMSImageMode.choice();
      await HMSImageMode.pageImages(pdf, async (image, page) => {
        const ext = image.type === 'png' ? 'png' : 'jpg';
        zip.file(`page-${String(page).padStart(4, '0')}.${ext}`, image.bytes);
      });
      $('status').textContent = 'Creating ZIP…';
      const blob = await zip.generateAsync({type:'blob', compression:'DEFLATE'});
      HMSImageMode.download(blob, `HMS_PDF_Images_${quality.dpi}DPI.zip`, 'application/zip');
      $('status').textContent = 'Completed / اكتمل';
    } catch(err) {
      console.error(err);
      $('status').textContent = 'Error / خطأ';
      alert(err.message || String(err));
    } finally {
      button.disabled = false;
    }
  };
})();
