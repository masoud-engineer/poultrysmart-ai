(()=>{'use strict';
const $=id=>document.getElementById(id);
const WELCOME='Hello! I can help interpret your recorded flock, feed, health schedule, growth, egg and financial information. What would you like to understand?';
const STORAGE_KEY='poultrysmart_ai_conversations_v1';
let history=[],busy=false,chatDB=null,conversations=[],activeId=null;
function status(s){$('aiStatus').textContent=s}
function uid(){return crypto.randomUUID?crypto.randomUUID():'chat-'+Date.now()+'-'+Math.random().toString(16).slice(2)}
function config(){
 const endpoint=$('aiEndpoint').value.trim(),access=$('aiAccessCode').value.trim();
 if(!endpoint||!access)throw new Error('Open Settings → Secure AI connection and enter the Worker URL and access code.');
 let u;try{u=new URL(endpoint)}catch{throw new Error('The Worker URL is not valid.')}
 if(u.protocol!=='https:')throw new Error('The AI Worker must use HTTPS.');
 return {endpoint:u.toString(),access};
}
async function callAI(payload){
 const c=config();
 await window.PoultrySmart.saveAIConfig($('aiEndpoint').value,$('aiAccessCode').value);
 const r=await fetch(c.endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-App-Access':c.access},body:JSON.stringify(payload)});
 let data={};try{data=await r.json()}catch{}
 if(!r.ok)throw new Error(data.error||('AI backend returned HTTP '+r.status));
 if(!data.answer)throw new Error('The AI backend returned an empty response.');
 return data.answer;
}
function openChatDB(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB'in window))return resolve(null);
  const req=indexedDB.open('poultrysmart-ai-chat',1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('conversations'))req.result.createObjectStore('conversations',{keyPath:'id'})};
  req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
 });
}
function localRead(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return []}}
async function loadChats(){
 try{
  chatDB=await openChatDB();
  if(chatDB)conversations=await new Promise((resolve,reject)=>{const req=chatDB.transaction('conversations','readonly').objectStore('conversations').getAll();req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error)});
  else conversations=localRead();
 }catch(e){console.warn('AI chat database unavailable; using local browser storage.',e);chatDB=null;conversations=localRead()}
 conversations.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
 if(!conversations.length){const c={id:uid(),title:'New conversation',createdAt:Date.now(),updatedAt:Date.now(),messages:[{role:'assistant',content:WELCOME}]};conversations=[c];activeId=c.id;await persist(c)}
 else activeId=conversations[0].id;
 renderConversationList();showConversation(activeId);
}
async function persist(chat){
 chat.updatedAt=Date.now();
 const i=conversations.findIndex(x=>x.id===chat.id);
 if(i<0)conversations.push(chat);else conversations[i]=chat;
 conversations.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
 try{
  if(chatDB)await new Promise((resolve,reject)=>{const tx=chatDB.transaction('conversations','readwrite');tx.objectStore('conversations').put(chat);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  else localStorage.setItem(STORAGE_KEY,JSON.stringify(conversations));
 }catch(e){status('Warning: this conversation could not be saved on this device. Check available browser storage.');console.error(e)}
 renderConversationList();
}
function current(){return conversations.find(x=>x.id===activeId)}
function renderConversationList(){
 const host=$('aiConversationList');if(!host)return;host.replaceChildren();
 conversations.forEach(chat=>{
  const item=document.createElement('div');item.className='ai-conversation-item'+(chat.id===activeId?' active':'');
  const open=document.createElement('button');open.type='button';open.className='ai-conversation-open';open.textContent=chat.title||'New conversation';open.title=chat.title||'New conversation';open.dataset.openChat=chat.id;
  const del=document.createElement('button');del.type='button';del.className='ai-conversation-delete secondary';del.textContent='×';del.title='Delete this conversation';del.setAttribute('aria-label','Delete '+(chat.title||'conversation'));del.dataset.deleteChat=chat.id;
  item.append(open,del);host.append(item);
 });
}
function renderMessages(){
 const host=$('aiMessages');host.replaceChildren();
 history.forEach(m=>{
  const node=document.createElement('div');node.className='ai-message '+(m.role==='user'?'user':'assistant');
  const who=document.createElement('b');who.textContent=m.role==='user'?'You':'PoultrySmart AI';
  const body=document.createElement('p');body.textContent=m.content;node.append(who,body);host.append(node);
 });
 host.scrollTop=host.scrollHeight;
}
function showConversation(id){
 const chat=conversations.find(x=>x.id===id);if(!chat)return;
 activeId=id;history=chat.messages.map(m=>({...m}));renderConversationList();renderMessages();
 status('Conversation saved on this device. Your farm records remain separate.');
}
async function newConversation(){
 if(busy)return;
 const chat={id:uid(),title:'New conversation',createdAt:Date.now(),updatedAt:Date.now(),messages:[{role:'assistant',content:WELCOME}]};
 activeId=chat.id;history=chat.messages.map(m=>({...m}));await persist(chat);showConversation(chat.id);$('aiQuestion').focus();
}
async function deleteConversation(id){
 if(busy)return;
 const chat=conversations.find(x=>x.id===id);if(!chat)return;
 if(!confirm('Delete this AI conversation from this device? This cannot be undone.'))return;
 conversations=conversations.filter(x=>x.id!==id);
 try{if(chatDB)await new Promise((resolve,reject)=>{const tx=chatDB.transaction('conversations','readwrite');tx.objectStore('conversations').delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});else localStorage.setItem(STORAGE_KEY,JSON.stringify(conversations))}
 catch(e){status('Could not delete the conversation from local storage.');return}
 if(activeId===id){if(conversations.length){conversations.sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));activeId=conversations[0].id;showConversation(activeId)}else await newConversation()}
 renderConversationList();
}
function append(role,content){history.push({role,content});renderMessages()}
async function send(raw){
 const message=String(raw||'').trim();if(!message||busy)return;
 if(!current())await newConversation();
 $('aiQuestion').value='';
 const chat=current();append('user',message);
 if(chat.title==='New conversation')chat.title=message.length>42?message.slice(0,39)+'…':message;
 await persist(chat);
 busy=true;$('aiSend').disabled=true;status('Reviewing your question and selected farm records…');
 const pending=document.createElement('div');pending.className='ai-message assistant';pending.id='aiPending';pending.textContent='PoultrySmart AI is thinking…';$('aiMessages').append(pending);
 try{
  const contextHistory=history.filter(m=>m.role==='user'||m.role==='assistant').slice(-7,-1);
  const answer=await callAI({mode:'chat',message,history:contextHistory,farmContext:window.PoultrySmart.getFarmContext()});
  $('aiPending')?.remove();append('assistant',answer);await persist(chat);status('Answer received. Conversation saved on this device.');
 }catch(e){$('aiPending')?.remove();const node=document.createElement('div');node.className='ai-message assistant';node.textContent='I could not complete that request: '+e.message;$('aiMessages').append(node);status('Check the Worker URL, access code, internet connection and API setup. Your question remains saved.');}
 finally{busy=false;$('aiSend').disabled=false;$('aiQuestion').focus();}
}
function compressImage(file){
 return new Promise(async(resolve,reject)=>{
  try{
   if(!file||!file.type.startsWith('image/'))throw new Error('Choose a valid image first.');
   if(!window.createImageBitmap){const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the photo.'));reader.readAsDataURL(file);return;}
   const bitmap=await createImageBitmap(file),scale=Math.min(1,1400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
   canvas.toBlob(blob=>{if(!blob)return reject(new Error('Could not compress the photo.'));const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read the compressed photo.'));reader.readAsDataURL(blob);},'image/jpeg',.82);
  }catch(e){reject(e);}
 });
}
document.addEventListener('DOMContentLoaded',async()=>{
 if(!window.PoultrySmart){status('Farm data interface did not load. Refresh the app.');return;}
 $('aiForm').addEventListener('submit',e=>{e.preventDefault();send($('aiQuestion').value)});
 $('aiQuestion').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send($('aiQuestion').value)}});
 $('aiClear').addEventListener('click',newConversation);
 $('aiConversationList').addEventListener('click',e=>{
  const open=e.target.closest('[data-open-chat]');if(open){showConversation(open.dataset.openChat);return}
  const del=e.target.closest('[data-delete-chat]');if(del)deleteConversation(del.dataset.deleteChat);
 });
 $('aiNewChat').addEventListener('click',newConversation);
 document.addEventListener('click',e=>{const b=e.target.closest('[data-ai-prompt]');if(b)send(b.dataset.aiPrompt)});
 $('photo').addEventListener('change',()=>{$('aiPhotoEstimate').disabled=!$('photo').files?.length;$('aiPhotoResult').textContent=$('photo').files?.length?'Photo ready. Request an AI estimate when you are ready.':'No photo selected.'});
 $('aiTestConnection').addEventListener('click',async()=>{
  const out=$('aiConnectionStatus'),button=$('aiTestConnection');let endpoint=$('aiEndpoint').value.trim();
  if(!endpoint){out.textContent='Enter the Worker HTTPS URL first.';return;}
  try{const u=new URL(endpoint);if(u.protocol!=='https:')throw new Error('The Worker URL must use HTTPS.');button.disabled=true;out.textContent='Checking secure backend…';
   const r=await fetch(u.toString(),{method:'GET'}),data=await r.json().catch(()=>({}));
   if(!r.ok||!data.ok)throw new Error(data.error||('HTTP '+r.status));
   out.textContent=data.configured?'Backend is reachable and both required secrets are configured. You can now send a test question.':'Backend is reachable, but required Worker secrets are missing.';
  }catch(e){out.textContent='Connection test failed: '+e.message;}finally{button.disabled=false;}
 });
 $('clearPhoto').addEventListener('click',()=>{$('aiPhotoEstimate').disabled=true;$('aiPhotoResult').textContent='No photo selected.'});
 $('aiPhotoEstimate').addEventListener('click',async()=>{
  const file=$('photo').files?.[0];if(!file)return;
  const button=$('aiPhotoEstimate');button.disabled=true;$('aiPhotoResult').textContent='Preparing the photo for visual analysis…';
  try{const image=await compressImage(file);if(String(image).length>4_000_000)throw new Error('The photo is too large after compression. Try a smaller image.');$('aiPhotoResult').textContent=await callAI({mode:'image',image,flockContext:window.PoultrySmart.getCameraFlock()});}
  catch(e){$('aiPhotoResult').textContent='AI photo estimate unavailable: '+e.message;}
  finally{button.disabled=false;}
 });
 await loadChats();
 const endpoint=$('aiEndpoint').value.trim();
 if(endpoint)status('AI connection details are saved. Your conversations are stored on this device.');
 else status('AI is not connected yet. Configure the secure Worker in Settings.');
});
})();