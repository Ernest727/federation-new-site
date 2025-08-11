export async function handler() {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({
      ok: true,
      hasGroq: !!process.env.GROQ_API_KEY,
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      node: process.version
    })
  };
}