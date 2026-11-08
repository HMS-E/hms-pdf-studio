/* HMS PDF Studio enhancements v1.7: preview zoom + high quality ZIP images */
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

  function selectedPages(spec, count) {
    if (!spec.trim()) return Array.from({length:count}, (_,i)=>i+1);
    const pages = new Set();
    for (const token of spec.split(',')) {
      const match = token.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);
      if (!match) throw Error('Invalid page range / نطاق الصفحات غير صحيح. Example: 1-3,5');
      const a=Number(match[1]), b=match[2]?Number(match[2]):a;
      if (a<1 || b>count || b<a || b-a>count) throw Error('Page number outside PDF / رقم صفحة غير موجود');
      for (let i=a;i<=b;i++) pages.add(i);
    }
    return [...pages].sort((a,b)=>a-b);
  }
  $('exportImages').onclick = async () => {
    const button = $('exportImages');
    if (button.disabled) return;
    button.disabled = true;
    try {
      if (!window.JSZip || !window.HMSImageMode) throw Error('Required PDF/image libraries are unavailable');
      const {pdf, file} = await HMSImageMode.openPdf();
      const pages=selectedPages($('exportPageRange').value,pdf.numPages);
      const preset=HMSImageMode.choice();
      preset.type=$('exportImageFormat').value==='jpeg'?'jpeg':'png';
      preset.quality=0.98;
      const ext=preset.type==='png'?'png':'jpg';
      const base=file.name.replace(/\.pdf$/i,'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,65)||'HMS_PDF';
      const zip=new JSZip();
      let one=null;
      for (const number of pages) {
        $('status').textContent=`Saving page ${number} / ${pdf.numPages} · ${preset.dpi} DPI`;
        const page=await pdf.getPage(number);
        const image=await HMSImageMode.renderAsImage(page,preset);
        const name=`${base}_page-${String(number).padStart(4,'0')}.${ext}`;
        if(pages.length===1) one={bytes:image.bytes,name};
        else zip.file(name,image.bytes);
        await new Promise(resolve=>setTimeout(resolve,0));
      }
      if(one) HMSImageMode.download(one.bytes,one.name,preset.type==='png'?'image/png':'image/jpeg');
      else {
        $('status').textContent='Creating ZIP / تجهيز الملف…';
        const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
        HMSImageMode.download(blob,`${base}_images_${preset.dpi}DPI.zip`,'application/zip');
      }
      $('status').textContent='Completed / اكتمل';
    } catch(err) {
      console.error(err);
      $('status').textContent='Error / خطأ';
      alert(err.message || String(err));
    } finally {button.disabled=false;}
  };
})();
