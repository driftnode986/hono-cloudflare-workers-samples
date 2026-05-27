# Ch09: Workers AI

Workers AI integration for text generation, classification, translation, and image recognition.

## Topics

- Workers AI binding configuration
- Text generation with Llama 3.1 (`@cf/meta/llama-3.1-8b-instruct`)
- Text summarization with system prompts
- Sentiment classification with DistilBERT (`@cf/huggingface/distilbert-sst-2-int8`)
- Translation with M2M-100 (`@cf/meta/m2m100-1.2b`)
- Image-to-text with LLaVA (`@cf/llava-hf/llava-1.5-7b-hf`)
- Streaming responses with Server-Sent Events

## Run

```bash
npm install
npm run dev
```

Workers AI requires a Cloudflare account. Local dev uses remote AI inference.

## Test endpoints

```bash
# Text generation
curl -X POST http://localhost:8787/ai/text \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Explain serverless computing in 3 sentences"}'

# Summarization
curl -X POST http://localhost:8787/ai/summarize \
  -H 'Content-Type: application/json' \
  -d '{"text":"Cloudflare Workers is a serverless platform..."}'

# Classification
curl -X POST http://localhost:8787/ai/classify \
  -H 'Content-Type: application/json' \
  -d '{"text":"This product is amazing!"}'

# Translation
curl -X POST http://localhost:8787/ai/translate \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello world","sourceLang":"en","targetLang":"ja"}'

# Streaming
curl -X POST http://localhost:8787/ai/stream \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Write a haiku about coding"}'
```
