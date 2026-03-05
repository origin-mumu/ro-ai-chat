import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

const MODEL_CONFIGS = {
  "qwen-plus": {
    apiKey: process.env.VITE_API_KEY,
    apiUrl:
      process.env.VITE_API_URL ||
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
    modelName: "qwen-plus",
  },
  mimo: {
    apiKey: process.env.VITE_MIMO_API_KEY,
    apiUrl:
      process.env.VITE_MIMO_API_URL ||
      "https://api.xiaomimimo.com/v1/chat/completions",
    modelName: "mimo-v2-flash",
  },
};

io.on("connection", (socket) => {
  console.log("A client connected:", socket.id);

  socket.on("chat_request", async (data) => {
    const { messageId, model = "qwen-plus", messages } = data;

    console.log(`Received request for model [${model}] with ID: ${messageId}`);

    try {
      const config = MODEL_CONFIGS[model];
      if (!config || !config.apiKey) {
        throw new Error(
          `API Key for model ${model} is not configured on the server.`,
        );
      }

      const apiMessages = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch(config.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.modelName,
          messages: apiMessages,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `API Error: ${response.status} ${JSON.stringify(errorData)}`,
        );
      }

      if (!response.body) {
        throw new Error("Response body from AI API is null");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          socket.emit(`chat_done_${messageId}`);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "data: [DONE]") continue;

          if (trimmedLine.startsWith("data: ")) {
            try {
              const json = JSON.parse(trimmedLine.slice(6));
              const content = json.choices[0]?.delta?.content || "";
              if (content) {
                socket.emit(`chat_chunk_${messageId}`, { content });
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error processing chat for ${messageId}:`, error);
      socket.emit(`chat_error_${messageId}`, { error: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`AI Backend Server running on http://localhost:${PORT}`);
});
