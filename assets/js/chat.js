(function(){
  'use strict';
  const chatButton=document.getElementById('chatButton');
  const chatPanel=document.getElementById('chatPanel');
  const chatClose=document.getElementById('chatClose');
  const chatInput=document.getElementById('chatInput');
  const chatSend=document.getElementById('chatSend');
  const chatMessages=document.getElementById('chatMessages');
  const typingIndicator=document.getElementById('typingIndicator');

  let isStreaming=false;
  const messages=[{role:'system',content:'UNIFYING, FACTUAL, HOPEFUL; reply in English, Kiswahili, or Luganda.'}];

  function init(){
    chatButton.addEventListener('click',()=>{ chatPanel.classList.toggle('active'); if(chatPanel.classList.contains('active')) chatInput.focus(); });
    chatClose.addEventListener('click',()=> chatPanel.classList.remove('active'));
    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage(); }});
    document.addEventListener('click', e=>{ if(!chatPanel.contains(e.target) && !chatButton.contains(e.target)) chatPanel.classList.remove('active'); });
  }

  async function sendMessage(){
    const text=chatInput.value.trim();
    if(!text || isStreaming) return;
    append('user', text);
    messages.push({role:'user', content:text});
    chatInput.value='';
    setStreaming(true); showTyping();
    try{
      const res = await fetch('/.netlify/functions/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages })
      });
      if(!res.ok) throw new Error('HTTP '+res.status);
      hideTyping();
      const wrap = append('assistant','');
      const content = wrap.querySelector('.message-content');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc='';
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        const chunk = decoder.decode(value, {stream:true});
        const lines = chunk.split('\n');
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if(data==='[DONE]') continue;
          try{
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if(delta){ acc+=delta; content.textContent=acc; chatMessages.scrollTop=chatMessages.scrollHeight; }
          }catch(_){}
        }
      }
      if(acc) messages.push({role:'assistant', content:acc});
    }catch(e){
      console.error(e);
      hideTyping();
      append('assistant','Chat temporarily unavailable. Please try again later.');
    }finally{ setStreaming(false); }
  }

  function append(role, text){
    const wrap=document.createElement('div'); wrap.className='message '+role;
    const b=document.createElement('div'); b.className='message-content'; b.textContent=text;
    wrap.appendChild(b); chatMessages.appendChild(wrap); chatMessages.scrollTop=chatMessages.scrollHeight; return wrap;
  }
  function showTyping(){ typingIndicator.classList.add('active'); chatMessages.appendChild(typingIndicator); chatMessages.scrollTop=chatMessages.scrollHeight; }
  function hideTyping(){ typingIndicator.classList.remove('active'); if(typingIndicator.parentNode===chatMessages) chatMessages.removeChild(typingIndicator); }
  function setStreaming(v){ isStreaming=v; chatInput.disabled=v; chatSend.disabled=v; }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();