export const CONFIG = {
    // WebSocket Settings
    WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
    WS_RECONNECT_MAX_ATTEMPTS: 5,
    WS_RECONNECT_BASE_DELAY_MS: 1000,

    // Storage Settings
    STORAGE_KEY: 'chat-store',
    STORAGE_DEBOUNCE_MS: 500,

    // Chat Settings
    MAX_CONTEXT_MESSAGES: 20, 
    MODEL_MODES: {
        'qwen-plus': {
            id: 'qwen-plus',
            name: '通义千问 Plus'
        },
        'mimo': {
            id: 'mimo',
            name: '小米MiMo'
        }
    } as const
} as const;

export type SupportedModel = keyof typeof CONFIG.MODEL_MODES;
