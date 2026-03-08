import { defineStore } from 'pinia';
import type { ChatState, ChatSession, Message, Role, ModeType } from '../types/chat';
import localforage from 'localforage';
import { CONFIG } from '../config';
export const useChatStore = defineStore('chat', {
    state: (): ChatState => ({
        sessions: [],
        currentSessionId: null,
        isStreaming: false,
        searchQuery: '',
        currentMode: 'qwen-plus',
        isConnected: true,
        isOffline: !navigator.onLine,
    }),

    getters: {
        currentSession: (state): ChatSession | undefined => {
            return state.sessions.find(s => s.id === state.currentSessionId);
        },
        filteredSessions: (state): ChatSession[] => {
            if (!state.searchQuery) return state.sessions;
            const query = state.searchQuery.toLowerCase().trim();
            if (!query) return state.sessions;

            // 优化搜索性能：只搜索标题和最新消息，使用较小的切片避免渲染过多
            return state.sessions.filter(s => {
                // 先检查标题是否匹配
                if (s.title.toLowerCase().includes(query)) {
                    return true;
                }

                // 只检查最新的几条消息，避免全量搜索
                const msgs = s.messages || [];
                const recentCount = Math.min(msgs.length, 5);
                for (let i = msgs.length - 1; i >= msgs.length - recentCount; i--) {
                    const msgContent = msgs[i]?.content;
                    if (msgContent && msgContent.toLowerCase().includes(query)) return true;
                }
                return false;
            });
        }
    },

    actions: {
        async initStorage(): Promise<void> {
            try {
                const stored = await localforage.getItem<string>(CONFIG.STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    parsed.isStreaming = false; // 强制重置状态，防止由于页面刷新导致的永久禁用死锁
                    this.$patch(parsed);
                }
            } catch (e) {
                console.error('Failed to load localforage state', e);
            }

            // 使用防抖存储，避免频繁的存储操作
            let saveTimeout: ReturnType<typeof setTimeout> | null = null;
            this.$subscribe((_mutation, state) => {
                if (saveTimeout !== null) {
                    clearTimeout(saveTimeout);
                }
                saveTimeout = setTimeout(() => {
                    localforage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state)).catch(e => {
                        console.error('IndexedDB save failed', e);
                    });
                    saveTimeout = null;
                }, CONFIG.STORAGE_DEBOUNCE_MS);
            });
        },

        setConnectionStatus(connected: boolean) {
            this.isConnected = connected;
        },

        setOfflineStatus(offline: boolean) {
            this.isOffline = offline;
        },

        createSession() {
            const newSession: ChatSession = {
                id: crypto.randomUUID(),
                title: 'New Chat',
                messages: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
                model: this.currentMode,
            };
            this.sessions = [newSession, ...this.sessions];
            this.currentSessionId = newSession.id;
        },

        selectSession(id: string) {
            this.currentSessionId = id;
            const session = this.sessions.find(s => s.id === id);
            if (session?.model) {
                this.currentMode = session.model;
            }
        },

        deleteSession(id: string) {
            this.sessions = this.sessions.filter(s => s.id !== id);
            if (this.currentSessionId === id) {
                this.currentSessionId = this.sessions[0]?.id || null;
            }
        },

        clearAllSessions() {
            this.sessions = [];
            this.currentSessionId = null;
            this.createSession();
        },

        setSearchQuery(query: string) {
            this.searchQuery = query;
        },

        addMessage(role: Role, content: string) {
            if (!this.currentSessionId) return;

            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                const newMessage: Message = {
                    id: crypto.randomUUID(),
                    role,
                    content,
                    timestamp: Date.now(),
                };
                session.messages.push(newMessage);
                session.updatedAt = Date.now();

                // Update title if it's the first user message
                if (role === 'user' && session.messages.length === 1) {
                    session.title = content.slice(0, 30) + (content.length > 30 ? '...' : '');
                }
            }
        },

        updateLastMessageContent(content: string) {
            if (!this.currentSessionId) return;

            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session && session.messages.length > 0) {
                const lastMessage = session.messages[session.messages.length - 1];
                if (lastMessage) {
                    lastMessage.content = content;
                }
            }
        },

        setStreaming(isStreaming: boolean) {
            this.isStreaming = isStreaming;
        },

        setCurrentModel(model: ModeType): void {
            this.currentMode = model;
            if (this.currentSessionId) {
                const session = this.sessions.find(s => s.id === this.currentSessionId);
                if (session) {
                    session.model = model;
                }
            }
        },

        getModelDisplayName(model: ModeType): string {
            return CONFIG.MODEL_MODES[model as keyof typeof CONFIG.MODEL_MODES]?.name || model;
        }
    },
});