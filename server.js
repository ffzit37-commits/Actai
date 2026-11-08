import express from "express";
import cors from "cors";
import multer from "multer";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";

const app=express(),PORT=process.env.PORT||10000;
app.use(cors());app.use(express.static("."));
const upload=multer({dest:path.join(os.tmpdir(),"cinemora-uploads"),limits:{fileSize:1024*1024*1024}});
const jobs=new Map();
function run(bin,args,timeout=30*60*1000){return new Promise((resolve,reject)=>{const p=spawn(bin,args,{stdio:["ignore","pipe","pipe"]});let out="",err="";p.stdout.on("data",d=>out+=d);p.stderr.on("data",d=>err+=d);const timer=setTimeout(()=>{p.kill("SIGKILL");reject(new Error("انتهت مهلة المعالجة؛ جرّب فيديو أقصر."))},timeout);p.on("error",e=>{clearTimeout(timer);reject(e)});p.on("close",code=>{clearTimeout(timer);code===0?resolve({out,err}):reject(new Error(err.slice(-1800)||"فشل FFmpeg"))})})}
async function probe(file){const {out}=await run(ffprobeStatic.path,["-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1:nokey=1",file],60000);const n=Number(out.trim());if(!Number.isFinite(n)||n<=0)throw new Error("تعذر قراءة مدة الفيديو.");return n}
async function sceneTimes(file){const {err}=await run(ffmpegPath,["-hide_banner","-i",file,"-vf","select='gt(scene,0.32)',showinfo","-an","-f","null","-"],15*60*1000).catch(e=>{if(String(e.message).includes("FFmpeg"))return {err:e.message};throw e});return [...err.matchAll(/pts_time:([0-9.]+)/g)].map(m=>Number(m[1])).filter(Number.isFinite)}
function chooseCuts(duration,count,scenes){const cuts=[0];for(let i=1;i<count;i++){const target=duration*i/count,window=duration/count*.28;const candidates=scenes.filter(t=>t>cuts[cuts.length-1]+3&&t<duration-3&&Math.abs(t-target)<=window);candidates.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target));cuts.push(candidates[0]??target)}cuts.push(duration);return cuts}
app.get("/health",(_req,res)=>res.json({status:"ok",service:"cinemora-ai"}));
app.post("/api/process",upload.single("video"),async(req,res)=>{
 const file=req.file?.path;if(!file)return res.status(400).json({error:"لم يصل ملف الفيديو."});
 const work=path.join(os.tmpdir(),"cinemora-jobs",crypto.randomUUID());await fs.mkdir(work,{recursive:true});
 try{
  const count=Math.max(2,Math.min(20,Number(req.body.episodes)||10)),ratio=req.body.ratio==="9:16"?"9:16":"16:9",quality=req.body.quality==="1080"?"1080":"2160",dub=req.body.dub==="true";
  const duration=await probe(file),scenes=await sceneTimes(file),cuts=chooseCuts(duration,count,scenes),episodes=[];
  for(let i=0;i<count;i++){
   const start=cuts[i],end=cuts[i+1],length=end-start;if(length<2)continue;
   const output=path.join(work,`episode-${String(i+1).padStart(2,"0")}.mp4`);
   const w=ratio==="9:16"?(quality==="2160"?2160:1080):(quality==="2160"?3840:1920),h=ratio==="9:16"?(quality==="2160"?3840:1920):(quality==="2160"?2160:1080);
   const vf=`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},setsar=1`;
   await run(ffmpegPath,["-y","-ss",String(start),"-i",file,"-t",String(length),"-vf",vf,"-c:v","libx264","-preset","veryfast","-crf","18","-c:a","aac","-b:a","192k","-movflags","+faststart",output],45*60*1000);
   const id=crypto.randomUUID();jobs.set(id,{file:output,expires:Date.now()+6*60*60*1000});
   episodes.push({name:`الحلقة ${i+1}.mp4`,start:stamp(start),end:stamp(end),duration:stamp(length),url:`/api/download/${id}`});
  }
  const notes=[];if(scenes.length===0)notes.push("لم تُكتشف انتقالات واضحة؛ استُخدمت نقاط تقسيم زمنية متساوية.");if(dub)notes.push("لم تُنفّذ الدبلجة بعد: لم يتم ربط خدمة التعرف على الكلام والترجمة وتوليد الصوت.");notes.push("تم تكبير الدقة وإعادة الترميز، وليس تحسيناً عصبياً بالذكاء الاصطناعي. كما أن القص العمودي يقتطع جوانب الصورة.");
  res.json({episodes,notice:notes.join(" ")});
 }catch(e){res.status(500).json({error:e.message||"حدث خطأ أثناء معالجة الفيديو."})}
 finally{await fs.rm(file,{force:true}).catch(()=>{});}
});
function stamp(s){const n=Math.max(0,Math.floor(s)),h=Math.floor(n/3600),m=Math.floor(n%3600/60),sec=n%60;return [h,m,sec].map(x=>String(x).padStart(2,"0")).join(":")}
app.get("/api/download/:id",async(req,res)=>{const job=jobs.get(req.params.id);if(!job||job.expires<Date.now())return res.status(404).send("انتهت صلاحية رابط التنزيل.");res.download(job.file,"cinemora-episode.mp4")});
setInterval(async()=>{for(const [id,j] of jobs){if(j.expires<Date.now()){await fs.rm(j.file,{force:true}).catch(()=>{});jobs.delete(id)}}},30*60*1000).unref();
app.use((err,_req,res,_next)=>res.status(err instanceof multer.MulterError?413:500).json({error:err instanceof multer.MulterError?"حجم الملف أكبر من الحد التجريبي (1GB).":err.message||"خطأ في الخادم."}));
app.listen(PORT,"0.0.0.0",()=>console.log(`CINEMORA AI listening on ${PORT}`));