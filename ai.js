(()=>{'use strict';
const $=id=>document.getElementById(id);
let history=[],busy=false;
function status(s){$('aiStatus').textContent=s}
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
function append(role,content){
 const node=document.createElement('div');node.className='ai-message '+role;
 const who=document.createElement('b');who.textContent=role==='user'?'You':'PoultrySmart AI';
 const body=document.createElement('p');body.textContent=content;node.append(who,body);$('aiMessages').append(node);$('aiMessages').scrollTop=$('aiMessages').scrollHeight;
}
async function send(raw){
 const message=String(raw||'').trim();if(!message||busy)return;
 $('aiQuestion').value='';append('user',message);history.push({role:'user',content:message});history=history.slice(-8);
 busy=true;$('aiSend').disabled=true;status('Reviewing your question and selected farm records…');
 const pending=document.createElement('div');pending.className='ai-message assistant';pending.id='aiPending';pending.textContent='PoultrySmart AI is thinking…';$('aiMessages').append(pending);
 try{
  const answer=await callAI({mode:'chat',message,history:history.slice(0,-1),farmContext:window.PoultrySmart.getFarmContext()});
  $('aiPending')?.remove();append('assistant',answer);history.push({role:'assistant',content:answer});history=history.slice(-8);status('Answer received. Farm records remain stored on this device.');
 }catch(e){$('aiPending')?.remove();append('assistant','I could not complete that request: '+e.message);status('Check the Worker URL, access code, internet connection and API setup.');}
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
document.addEventListener('DOMContentLoaded',()=>{
 if(!window.PoultrySmart){status('Farm data interface did not load. Refresh the app.');return;}
 $('aiForm').addEventListener('submit',e=>{e.preventDefault();send($('aiQuestion').value)});
 $('aiQuestion').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();send($('aiQuestion').value)}});
 $('aiClear').addEventListener('click',()=>{history=[];$('aiMessages').replaceChildren();append('assistant','Conversation cleared. Ask me about your farm whenever you are ready.');status('Conversation is held only in this page session.');});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-ai-prompt]');if(b)send(b.dataset.aiPrompt)});
 $('photo').addEventListener('change',()=>{$('aiPhotoEstimate').disabled=!$('photo').files?.length;$('aiPhotoResult').textContent=$('photo').files?.length?'Photo ready. Request an AI estimate when you are ready.':'No photo selected.'});
 $('clearPhoto').addEventListener('click',()=>{$('aiPhotoEstimate').disabled=true;$('aiPhotoResult').textContent='No photo selected.'});
 $('aiPhotoEstimate').addEventListener('click',async()=>{
  const file=$('photo').files?.[0];if(!file)return;
  const button=$('aiPhotoEstimate');button.disabled=true;$('aiPhotoResult').textContent='Preparing the photo for visual analysis…';
  try{
   const image=await compressImage(file);if(String(image).length>4_000_000)throw new Error('The photo is too large after compression. Try a smaller image.');
   $('aiPhotoResult').textContent=await callAI({mode:'image',image,flockContext:window.PoultrySmart.getCameraFlock()});
  }catch(e){$('aiPhotoResult').textContent='AI photo estimate unavailable: '+e.message;}
  finally{button.disabled=false;}
 });
 const endpoint=$('aiEndpoint').value.trim();
 status(endpoint?'AI connection details are saved. Ask a question to test the connection.':'AI is not connected yet. Configure the secure Worker in Settings.');
});
})();