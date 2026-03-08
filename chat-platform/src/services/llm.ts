import type { Message, ModeType } from '../types/chat';
import { CONFIG } from '../config';

export interface ChatCompletionRequest {
  model: string;
  messages: { role: string; content: string }[];
  stream: boolean;
}



// 异步生成器函数，用于流式获取聊天完成结果
export async function* streamCompletion(messages: Message[], model: ModeType = 'qwen-plus') {
  const { useChatStore } = await import('../stores/chat');
  const chatStore = useChatStore();

  // 采用滑动窗口保留最近10轮对话 (即 20 条消息)
  const contextMessages = messages.slice(-CONFIG.MAX_CONTEXT_MESSAGES);
  const apiMessages = contextMessages
    .filter(msg => !(msg.role === 'assistant' && msg.content === ''))
    .map(msg => ({
      role: msg.role,
      content: msg.content
    }));

  let connectAttempts = 0;
  let ws: WebSocket;
  const messageQueue: string[] = [];
  let isDone = false;
  let errorMsg: string | null = null;
  let resolveCurrent: (() => void) | null = null;

  const connect = () => {
    return new Promise<void>((resolve, reject) => {
      console.log(`Connecting to WebSocket at ${CONFIG.WS_URL} with model ${model} (Attempt ${connectAttempts + 1})`);
      ws = new WebSocket(CONFIG.WS_URL);

      ws.onopen = () => {
        chatStore.setConnectionStatus(true);
        connectAttempts = 0; // 重置连接次数
        ws.send(JSON.stringify({
          model: model,
          messages: apiMessages
        }));
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.error) {
            errorMsg = data.error;
            if (resolveCurrent) resolveCurrent();
          } else if (data.done) {
            isDone = true;
            if (resolveCurrent) resolveCurrent();
          } else if (data.content) {
            messageQueue.push(data.content);
            if (resolveCurrent) resolveCurrent();
          }
        } catch (e) {
          console.error('Failed to parse WS message', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket error', e);
        // Error will trigger onclose where retry happens
      };

      ws.onclose = (event) => {
        chatStore.setConnectionStatus(false);
        if (isDone) {
          if (resolveCurrent) resolveCurrent();
          return;
        }

        // 如果非正常关闭，尝试重连
        if (event.code !== 1000 && connectAttempts < CONFIG.WS_RECONNECT_MAX_ATTEMPTS) {
          connectAttempts++;
          const delay = CONFIG.WS_RECONNECT_BASE_DELAY_MS * Math.pow(2, connectAttempts);
          console.log(`Connection lost. Retrying in ${delay}ms...`);
          setTimeout(() => {
            connect().catch(reject);
          }, delay);
        } else if (event.code !== 1000) {
          errorMsg = 'WebSocket connection failed after maximum retries.';
          isDone = true;
          if (resolveCurrent) resolveCurrent();
          reject(new Error(errorMsg));
        } else {
          isDone = true;
          if (resolveCurrent) resolveCurrent();
        }
      };
    });
  };

  try {
    await connect();
  } catch (e) {
    throw e;
  }

  while (!isDone || messageQueue.length > 0) {
    if (messageQueue.length > 0) {
      yield messageQueue.shift()!;
    } else if (errorMsg) {
      throw new Error(errorMsg);
    } else if (!isDone) {
      await new Promise<void>(resolve => {
        resolveCurrent = resolve;
      });
      resolveCurrent = null;
    }
  }

  if (errorMsg) {
    throw new Error(errorMsg);
  }
}

export function getAvailableModels(): ModeType[] {
  // Models are no longer gated by frontend API keys because the backend handles them.
  // We read the available options from CONFIG.
  return Object.keys(CONFIG.MODEL_MODES) as ModeType[];
}
