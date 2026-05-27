// src/index.ts — Ch09: Workers AI Integration
import { Hono } from 'hono';

type Bindings = {
  AI: Ai;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  return c.json({
    name: 'Workers AI Demo',
    endpoints: ['/ai/text', '/ai/summarize', '/ai/classify', '/ai/translate', '/ai/image-to-text'],
  });
});

// --- Text generation ---
app.post('/ai/text', async (c) => {
  const { prompt, maxTokens } = await c.req.json<{ prompt: string; maxTokens?: number }>();

  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'You are a helpful assistant. Keep responses concise.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: maxTokens ?? 256,
  });

  return c.json({ response });
});

// --- Text summarization ---
app.post('/ai/summarize', async (c) => {
  const { text } = await c.req.json<{ text: string }>();

  const response = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [
      { role: 'system', content: 'Summarize the following text in 2-3 sentences.' },
      { role: 'user', content: text },
    ],
    max_tokens: 150,
  });

  return c.json({ summary: response });
});

// --- Text classification ---
app.post('/ai/classify', async (c) => {
  const { text } = await c.req.json<{ text: string }>();

  const response = await c.env.AI.run('@cf/huggingface/distilbert-sst-2-int8', {
    text,
  });

  return c.json({ classification: response });
});

// --- Translation ---
app.post('/ai/translate', async (c) => {
  const { text, sourceLang, targetLang } = await c.req.json<{
    text: string;
    sourceLang: string;
    targetLang: string;
  }>();

  const response = await c.env.AI.run('@cf/meta/m2m100-1.2b', {
    text,
    source_lang: sourceLang,
    target_lang: targetLang,
  });

  return c.json({ translation: response });
});

// --- Image to text (describe image) ---
app.post('/ai/image-to-text', async (c) => {
  const imageData = await c.req.arrayBuffer();

  const response = await c.env.AI.run('@cf/llava-hf/llava-1.5-7b-hf', {
    image: [...new Uint8Array(imageData)],
    prompt: 'Describe this image in detail.',
    max_tokens: 256,
  });

  return c.json({ description: response });
});

// --- Streaming text generation ---
app.post('/ai/stream', async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();

  const stream = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
    stream: true,
  });

  return new Response(stream as ReadableStream, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
});

export default app;
