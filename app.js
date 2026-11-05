const form=document.getElementById("chatForm");
const input=document.getElementById("prompt");
const messages=document.getElementById("messages");
const welcome=document.getElementById("welcome");
const historyBox=document.getElementById("history");
const sidebar=document.getElementById("sidebar");

function addMessage(text,role){
  const item=document.createElement("article");item.className="message "+role;
  const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=role==="user"?"أنت":"A";
  const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=text;
  item.append(avatar,bubble);messages.append(item);
}
function showPrototypeNotice(){
  addMessage("وصلني طلبك. هذه نسخة الواجهة الأولية؛ لم نربط بعد محرك الذكاء الاصطناعي أو أدوات تنفيذ المهام. الخطوة التالية هي إعداد الخادم وربط نموذج ذكاء اصطناعي آمن.","assistant");
}
function sendMessage(text){
  const value=(text||input.value).trim();if(!value)return;
  welcome.hidden=true;addMessage(value,"user");input.value="";input.style.height="auto";
  const title=value.length>32?value.slice(0,32)+"…":value;
  const historyItem=document.createElement("button");historyItem.className="history-item";historyItem.textContent=title;
  historyItem.addEventListener("click",()=>{messages.innerHTML="";welcome.hidden=true;addMessage(value,"user");showPrototypeNotice()});
  historyBox.prepend(historyItem);showPrototypeNotice();
}
function newChat(){messages.innerHTML="";welcome.hidden=false;input.value="";input.focus()}
form.addEventListener("submit",e=>{e.preventDefault();sendMessage()});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,180)+"px"});
document.querySelectorAll("[data-prompt]").forEach(button=>button.addEventListener("click",()=>sendMessage(button.dataset.prompt)));
document.querySelectorAll("[data-tool]").forEach(button=>button.addEventListener("click",()=>{input.value="أريد استخدام Actai في: "+button.dataset.tool;input.focus();sidebar.classList.remove("open")}));
document.getElementById("newChat").addEventListener("click",newChat);
document.getElementById("clearBtn").addEventListener("click",newChat);
document.getElementById("menuBtn").addEventListener("click",()=>sidebar.classList.toggle("open"));
