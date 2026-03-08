import express from 'express';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
});

const wss = new WebSocketServer({ server });

const MODEL_CONFIGS = {
  'qwen-plus': {
    apiKey: process.env.VITE_API_KEY,
    apiUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    modelName: 'qwen-plus'
  },
  'mimo': {
    apiKey: process.env.VITE_MIMO_API_KEY,
    apiUrl: 'https://api.xiaomimimo.com/v1/chat/completions',
    modelName: 'mimo-v2-flash'
  }
};

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const { model, messages } = data;
      
      const config = MODEL_CONFIGS[model] || MODEL_CONFIGS['qwen-plus'];
      if (!config.apiKey) {
        ws.send(JSON.stringify({ error: `${model} API Key not configured.` }));
        ws.close();
        return;
      }

      console.log(`Using model: ${config.modelName}`);

      const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.modelName,
          messages: messages,
          stream: true
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        ws.send(JSON.stringify({ error: `API Error: ${response.status} ${JSON.stringify(error)}` }));
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

          if (trimmedLine.startsWith('data: ')) {
            try {
              const json = JSON.parse(trimmedLine.slice(6));
              const contentChunk = json.choices[0]?.delta?.content || '';
              if (contentChunk) {
                 ws.send(JSON.stringify({ content: contentChunk }));
              }
            } catch (e) {
              console.error('Error parsing stream chunk', e);
            }
          }
        }
      }
      ws.send(JSON.stringify({ done: true }));
    } catch (err) {
      console.error(err);
      ws.send(JSON.stringify({ error: err.message }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});
