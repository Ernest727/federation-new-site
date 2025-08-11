# YEF Chat (Groq)
- In-site chat UI streaming via Netlify Function
- Backend uses **Groq** OpenAI-compatible API (no OpenAI credits needed)
- Frontend: `assets/js/chat.js`
- Functions: `netlify/functions/chat.js`, `netlify/functions/diag.js`

## Deploy (GitHub → Netlify)
1. Upload these files to your GitHub repo root (not nested).
2. In Netlify: Link the repo.
3. Build settings: Base dir blank, Publish dir `.`, Functions dir `netlify/functions`.

## Environment variables
- Add `GROQ_API_KEY` in Site settings → Environment variables.
- (Optional) You can also keep `OPENAI_API_KEY` — diag will show both.

## Verify
- Visit `/.netlify/functions/diag` -> should show `hasGroq: true`.
- Open the site and send a message — it should stream.

## Change model
- Edit `netlify/functions/chat.js` → model: `llama-3.1-8b-instant` (fast). You can switch to `llama-3.1-70b-versatile` for higher quality.
