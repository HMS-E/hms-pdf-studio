'use strict';
const $=id=>document.getElementById(id);let doc=null,selected=0,inputs=[];
function status(s){$('status').textContent=s}
function ready(){if(!window.PDFLib)throw Error('تعذر تحميل مكتبة PDF. اتصل بالإنترنت في التشغيل الأول.');}
function pct(id){const n=Number($(id).value);if(!Number.isFinite(n)||n<0||n>100)throw Error('يجب أن تكون النسب بين 0 و100');return n/100}
function refresh(){const pages=$('pages');pages.replaceChildren();if(!doc){$('info').textContent='لم يتم اختيار ملفات';return} $('info').textContent=`${doc.getPageCount()} صفحة`;
 doc.getPages().forEach((p,i)=>{const b=document.createElement('button');b.className='page'+(i===selected?' active':'');b.textContent=`صفحة ${i+1} — ${Math.round(p.getWidth())}×${Math.round(p.getHeight())}`;b.onclick=()=>{selected=i;refresh()};pages.append(b)});}
async function loadFirst(){ready();const f=inputs[0];if(!f)throw Error('اختر ملف PDF');doc=await PDFLib.PDFDocument.load(await f.arrayBuffer());selected=0;refresh();status('تم فتح الملف محليًا')}
$('files').onchange=async e=>{inputs=Array.from(e.target.files);try{await loadFirst()}catch(err){status(err.message)}};
async function merge(){ready();if(!inputs.length)throw Error('اختر ملفات');const out=await PDFLib.PDFDocument.create();for(const f of inputs){const src=await PDFLib.PDFDocument.load(await f.arrayBuffer());const copied=await out.copyPages(src,src.getPageIndices());copied.forEach(p=>out.addPage(p))}doc=out;selected=0;refresh();status('تم دمج الملفات. اضغط حفظ التعديلات لتنزيل النتيجة.')}
function page(){if(!doc||!doc.getPageCount())throw Error('اختر ملف PDF أولًا');return doc.getPage(selected)}
function download(bytes,name){const blob=new Blob([bytes],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)}
async function action(fn){try{await fn()}catch(err){status('خطأ: '+err.message)}}
$('merge').onclick=()=>action(merge);
$('save').onclick=()=>action(async()=>{if(!doc)throw Error('اختر ملف PDF');download(await doc.save(),'HMS_edited.pdf');status('تم تجهيز الملف للتنزيل')});
$('remove').onclick=()=>action(async()=>{page();if(doc.getPageCount()===1)throw Error('لا يمكن حذف الصفحة الأخيرة');doc.removePage(selected);selected=Math.min(selected,doc.getPageCount()-1);refresh();status('تم حذف الصفحة من نسخة العمل')});
$('addText').onclick=()=>action(async()=>{const p=page(),txt=$('note').value;if(!txt.trim())throw Error('اكتب النص');if(/[^\x00-\x7F]/.test(txt))throw Error('هذه النسخة تدعم النص الإنجليزي فقط');const font=await doc.embedFont(PDFLib.StandardFonts.Helvetica);p.drawText(txt,{x:p.getWidth()*pct('x'),y:p.getHeight()*(1-pct('y')),font,size:14,color:PDFLib.rgb(0,0,0)});status('تمت إضافة النص. احفظ الملف لتنزيله')});
$('cover').onclick=()=>action(async()=>{const p=page(),x=pct('rx'),y=pct('ry'),w=pct('rw'),h=pct('rh');if(x+w>1||y+h>1)throw Error('المستطيل خارج الصفحة');p.drawRectangle({x:p.getWidth()*x,y:p.getHeight()*(1-y-h),width:p.getWidth()*w,height:p.getHeight()*h,color:PDFLib.rgb(1,1,1)});status('تمت تغطية المنطقة بصريًا، ولم يتم حذف المحتوى الأصلي')});
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
