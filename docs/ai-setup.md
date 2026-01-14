# AI Setup

## 1) Copy the environment template

```bash
cp .env.example .env.local
```

## 2) Add your OpenRouter API key

Open `.env.local` and set:

```bash
OPENROUTER_API_KEY=your_key_here
```

## 3) Install dependencies and restart the dev server

```bash
npm install
npm run dev
```

## 4) Try the API

```bash
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello from Dialogue Forge"
      }
    ]
  }'
```
