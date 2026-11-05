const form=document.getElementById("chatForm");
const input=document.getElementById("prompt");
const messages=document.getElementById("messages");
const welcome=document.getElementById("welcome");
const historyBox=document.getElementById("history");
const sidebar=document.getElementById("sidebar");
const sendBtn=document.getElementById("sendBtn");
const API_BASE_URL="https://actai-ukmf.onrender.com";
const conversations=[];
let activeConversation=null;

function addMessage(text,role){
  const item=document.createElement("article");item.className="message "+role;
  const avatar=document.createElement("div");avatar.className="avatar";avatar.textContent=role==="user"?"أنت":"A";
  const bubble=document.createElement("div");bubble.className="bubble";bubble.textContent=text;
  item.append(avatar,bubble);messages.append(item);
  document.getElementById("conversation").scrollTop=document.getElementById("conversation").scrollHeight;
  return bubble;
}
function createConversation(){
  activeConversation={id:Date.now(),title:"محادثة جديدة",messages:[]};
  conversations.unshift(activeConversation);
  renderHistory();
  messages.innerHTML="";welcome.hidden=false;input.value="";input.focus();
}
function renderHistory(){
  historyBox.innerHTML="";
  if(!conversations.length){const empty=document.createElement("div");empty.className="empty-history";empty.textContent="ستظهر محادثاتك هنا";historyBox.append(empty);return}
  conversations.forEach(conversation=>{
    const button=document.createElement("button");button.className="history-item";button.textContent=conversation.title;
    button.addEventListener("click",()=>openConversation(conversation.id));historyBox.append(button);
  });
}
function openConversation(id){
  activeConversation=conversations.find(item=>item.id===id);messages.innerHTML="";welcome.hidden=true;
  activeConversation.messages.forEach(message=>addMessage(message.text,message.role));
  sidebar.classList.remove("open");
}
async function sendMessage(){
  const value=input.value.trim();if(!value||sendBtn.disabled)return;
  if(!activeConversation)activeConversation={id:Date.now(),title:value.slice(0,34),messages:[]};
  if(!conversations.some(item=>item.id===activeConversation.id))conversations.unshift(activeConversation);
  activeConversation.title=activeConversation.messages.length?activeConversation.title:value.slice(0,34);
  activeConversation.messages.push({role:"user",text:value});
  welcome.hidden=true;addMessage(value,"user");input.value="";input.style.height="auto";renderHistory();
  const reply=addMessage("أعمل على طلبك…","assistant");
  sendBtn.disabled=true;
  try{
    const response=await fetch(`${API_BASE_URL}/api/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:value,conversation_id:String(activeConversation.id),language:"ar",routing:"automatic"})});
    if(!response.ok)throw new Error("تعذر الاتصال بخدمة الذكاء الاصطناعي.");
    const data=await response.json();
    const answer=data.reply||data.message||data.output;
    if(!answer)throw new Error("وصل رد غير مكتمل من الخادم.");
    reply.textContent=answer;activeConversation.messages.push({role:"assistant",text:answer});
  }catch(error){
    const notice=error.message||"تعذر الاتصال بخادم Actai. تحقق من أن الخادم منشور على Render.";
    reply.textContent=notice;activeConversation.messages.push({role:"assistant",text:notice});
  }finally{sendBtn.disabled=false;input.focus()}
}
form.addEventListener("submit",event=>{event.preventDefault();sendMessage()});
input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,190)+"px"});
input.addEventListener("keydown",event=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();sendMessage()}});
document.getElementById("newChat").addEventListener("click",createConversation);
document.getElementById("clearBtn").addEventListener("click",createConversation);
document.getElementById("menuBtn").addEventListener("click",()=>sidebar.classList.toggle("open"));
renderHistory();