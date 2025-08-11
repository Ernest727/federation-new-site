// Chat via Groq (OpenAI-compatible) streaming
export async function handler(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
  try {
    const { messages } = JSON.parse(event.body || '{}');
    if (!process.env.GROQ_API_KEY) {
      return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'GROQ_API_KEY missing' }) };
    }
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.4,
        stream: true,
        max_tokens: 500
      })
    });
    if(!r.ok){
      const t = await r.text();
      return { statusCode: r.status, headers:{ 'Access-Control-Allow-Origin':'*' }, body: t };
    }
    const reader = r.body.getReader();
    const decoder = new TextDecoder();
    let sse = '';
    while(true){
      const {done, value} = await reader.read();
      if(done) break;
      sse += decoder.decode(value, {stream:true});
    }
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff'
      },
      body: sse
    };
  } catch (e) {
    return { statusCode: 500, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: e.message }) };
  }
}