const input=document.getElementById("video"),drop=document.getElementById("dropzone"),choose=document.getElementById("choose"),processBtn=document.getElementById("process"),statusBox=document.getElementById("status"),fileInfo=document.getElementById("fileInfo");
let selected=null;
const fmt=n=>n<1024*1024?(n/1024).toFixed(0)+" KB":(n/1024/1024).toFixed(1)+" MB";
function pick(file){if(!file)return;if(!file.type.startsWith("video/")){setStatus("اختر ملف فيديو صالحاً.","error");return}selected=file;fileInfo.textContent=file.name+" · "+fmt(file.size);processBtn.disabled=false;setStatus("تم اختيار الفيديو. يمكنك بدء التحليل.","good")}
function setStatus(t,c=""){statusBox.textContent=t;statusBox.className="status "+c}
choose.addEventListener("click",e=>{e.stopPropagation();input.click()});drop.addEventListener("click",()=>input.click());input.addEventListener("change",()=>pick(input.files[0]));
for(const ev of ["dragenter","dragover"])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add("drag")});
for(const ev of ["dragleave","drop"])drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove("drag")});
drop.addEventListener("drop",e=>pick(e.dataTransfer.files[0]));
document.getElementById("minus").onclick=()=>document.getElementById("episodes").stepDown();document.getElementById("plus").onclick=()=>document.getElementById("episodes").stepUp();
processBtn.addEventListener("click",async()=>{
 if(!selected)return;const count=Math.max(2,Math.min(20,Number(document.getElementById("episodes").value)||10));const ratio=document.querySelector('input[name="ratio"]:checked').value;const quality=document.getElementById("upscale").value;const dub=document.getElementById("dub").checked;
 const data=new FormData();data.append("video",selected);data.append("episodes",String(count));data.append("ratio",ratio);data.append("quality",quality);data.append("dub",String(dub));
 processBtn.disabled=true;setStatus("جارٍ رفع الفيديو وتحليل انتقالات المشاهد… قد يستغرق ذلك وقتاً.");document.getElementById("results").hidden=true;
 try{
  const res=await fetch("/api/process",{method:"POST",body:data});const result=await res.json();if(!res.ok)throw new Error(result.error||"فشلت المعالجة.");
  const list=document.getElementById("episodeList");list.innerHTML="";
  result.episodes.forEach(ep=>{const card=document.createElement("article");card.className="episode";const title=document.createElement("b");title.textContent=ep.name;const meta=document.createElement("small");meta.textContent=ep.start+" – "+ep.end+" · "+ep.duration;const link=document.createElement("a");link.href=ep.url;link.textContent="تنزيل الحلقة ↓";link.download=ep.name;card.append(title,meta,link);list.append(card)});
  document.getElementById("resultCount").textContent=result.episodes.length+" حلقات";document.getElementById("results").hidden=false;
  setStatus(result.notice||"اكتملت المعالجة. نزّل حلقاتك الآن.","good");
 }catch(err){setStatus(err.message,"error")}finally{processBtn.disabled=false}
});