<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import Sidebar from "../components/Layout/Sidebar.vue";
import ChatInput from "../components/Chat/ChatInput.vue";
import MessageBubble from "../components/Chat/MessageBubble.vue";
import VirtualList from "../components/common/VirtualList.vue";
import { useChatStore } from "../stores/chat";
import { storeToRefs } from "pinia";
import { streamCompletion, getAvailableModels } from "../services/llm";
import type { ModeType } from "../types/chat";
const chatStore = useChatStore();
const { currentSession, isStreaming, currentMode } = storeToRefs(chatStore);

const virtualListRef = ref<any>(null);
const scrollTimer = ref<number | null>(null);

const showModelDropdown = ref(false);
const switchModel = (model: ModeType) => {
  chatStore.setCurrentModel(model);
};
// 滚动到消息列表底部
const scrollToBottom = async () => {
  await nextTick();
  if (virtualListRef.value) {
    virtualListRef.value.scrollToBottom();
  }
};

const forceScrollToBottom = async () => {
  await nextTick();
  scrollToBottom();
};

const availableModels = getAvailableModels();

// 监听消息列表变化，滚动到底部
watch(
  () => currentSession.value?.messages.length,
  () => {
    forceScrollToBottom();
  },
);

// 监听会话切换，强制滚动到底部
watch(
  () => chatStore.currentSessionId,
  () => {
    forceScrollToBottom();
  },
);

// 监听最新消息内容变化，智能滚动
watch(
  () =>
    currentSession.value?.messages[currentSession.value.messages.length - 1]
      ?.content,
  () => {
    if (virtualListRef.value && virtualListRef.value.containerRef) {
      const scroller = virtualListRef.value.containerRef;
      if (!scrollTimer.value) {
        scrollTimer.value = setTimeout(() => {
          const scrollBottom =
            scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight;

          // 更宽松的阈值，正在生成时只要你没有大幅往上滑就一直帮你滚到底部
          const isNearBottom = scrollBottom <= 1000 || chatStore.isStreaming;

          if (isNearBottom) {
            virtualListRef.value.scrollToBottom();
          }

          scrollTimer.value = null;
        }, 80) as unknown as number;
      }
    }
  },
  { deep: true },
);

// 组件卸载时清理计时器
onUnmounted(() => {
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value);
  }
});

const handleSend = async (content: string) => {
  if (!currentSession.value) return;
  // 发送用户消息
  chatStore.addMessage("user", content);
  // 设置为流式响应模式
  chatStore.setStreaming(true);
  // 添加助手空占位符
  chatStore.addMessage("assistant", "");

  try {
    // 获取当前会话的消息列表
    const messages = currentSession.value.messages;

    // 调用流式完成函数，处理每个返回的 chunk
    for await (const chunk of streamCompletion(messages, currentMode?.value)) {
      //如果当前会话存在
      //
      if (currentSession.value) {
        const lastMsgIdx = currentSession.value.messages.length - 1;
        const lastMsg = currentSession.value.messages[lastMsgIdx];
        if (lastMsg) {
          chatStore.updateLastMessageContent(lastMsg.content + chunk);
        }
      }
    }
  } catch (error) {
    console.error("Failed to generate response:", error);
    chatStore.updateLastMessageContent(
      "Sorry, I encountered an error while generating the response.",
    );
  } finally {
    chatStore.setStreaming(false);
  }
};

onMounted(() => {
  // 初始化时创建会话
  if (!chatStore.currentSessionId) {
    chatStore.createSession();
  }
});
</script>

<template>
  <div class="chat-layout">
    <Sidebar />
    <main class="main-content">
      <header class="chat-header">
        <div class="model-selector">
          <div class="selector" @mouseenter="showModelDropdown = true">
            {{ currentSession?.model || "qwen-plus" }}

            <span
              v-if="chatStore.isConnected"
              class="text-green-500 text-xs ml-2"
              title="Backend Connected"
              >●</span
            >
            <span
              v-else
              class="text-red-500 text-xs ml-2"
              title="Backend Disconnected"
              >● Reconnecting...</span
            >
          </div>

          <div
            class="model-dropdown"
            v-if="showModelDropdown"
            @mouseleave="showModelDropdown = false"
          >
            <div
              class="model-option"
              :key="model"
              v-for="model in availableModels"
              :class="{ active: currentMode === model }"
              @click="switchModel(model)"
            >
              <span>{{ model }}</span>
              <span
                v-if="currentMode === model"
                class="text-green-500 text-xs ml-2"
                title="Backend Connected"
                >●</span
              >
            </div>
          </div>
        </div>
      </header>

      <div class="messages-container" ref="messagesContainerRef">
        <div
          v-if="!currentSession || currentSession.messages.length === 0"
          class="empty-state"
        >
          <div class="logo-large">
            <span class="logo-emoji">🐲</span>
          </div>
          <h2>你好！我是 ai智能助手</h2>
          <p>有什么我可以帮你的吗？</p>
        </div>

        <div v-else class="messages-list relative">
          <VirtualList
            ref="virtualListRef"
            :items="currentSession.messages"
            keyField="id"
            :estimatedItemSize="100"
            :buffer="10"
            class="scroller"
          >
            <template #default="{ item }">
              <MessageBubble :message="item" />
            </template>
          </VirtualList>
        </div>
      </div>

      <div class="input-area">
        <ChatInput @send="handleSend" :disabled="isStreaming" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-color);
  overflow: hidden;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.chat-header {
  height: 60px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: var(--bg-color);
  z-index: 10;
}
.model-selector {
  position: relative;
}

.selector {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: space-between;
  font-weight: 600;
  color: var(--text-color);
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.selector:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.model-dropdown {
  position: absolute;
  width: 150px;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-top: 4px;
  overflow-y: auto;
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  flex-wrap: nowrap;
  cursor: pointer;
  transition: background-color 0.2s;
}

.model-option:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  width: 100%;
  flex-direction: column;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.messages-list {
  margin: 0 auto;
  width: 100%;
  height: 100%;
}

.scroller {
  width: 100%;
  height: 100%;
  padding: 0 100px;
  scroll-behavior: smooth;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-color);
  opacity: 0.8;
}

.logo-large {
  font-size: 4rem;
  margin-bottom: 20px;
}

.scroll-anchor {
  height: 1px;
}

.input-area {
  padding-bottom: 24px;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .chat-layout {
    flex-direction: column;
  }

  .chat-header {
    padding: 0 12px;
  }

  .messages-container {
    padding: 10px 0;
  }

  .scroller {
    padding: 0 16px;
  }

  .empty-state h2 {
    font-size: 1.2rem;
  }
}
</style>
