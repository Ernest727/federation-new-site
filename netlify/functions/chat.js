// netlify/functions/chat.js
export async function handler(event) {
  try {
    const { messages } = JSON.parse(event.body || "{}");

    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama3-70b-8192",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are YEF’s helpful assistant. Be concise, positive, and truthful. Focus on education about East African Federation. Avoid promising timelines; emphasize what YEF is advocating for."
          },
          ...(Array.isArray(messages) ? messages : [])
        ]
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return { statusCode: resp.status, body: t };
    }
    const data = await resp.json();
    const text = data?.choices?.[0]?.message?.content || "…";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: text })
    };
  } catch (e) {
    return { statusCode: 500, body: e?.stack || String(e) };
  }
}
