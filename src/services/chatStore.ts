export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
    id: string;
    conversationId: string;
    role: ChatRole;
    content: string;
    model: string | null;
    createdAt: string;
}

export interface ChatConversation {
    id: string;
    title: string;
    pinned: boolean;
    systemMessage: string;
    model: string | null;
    createdAt: string;
    updatedAt: string;
    lastMessageAt: string | null;
}

export interface ChatSettings {
    host: string;
    model: string;
    defaultSystemMessage: string;
}

interface ChatDatabase extends IDBDatabase {
    // Intentionally empty. This interface exists to make the IndexedDB helpers explicit.
}

const DB_NAME = 'ollama-local-chat-ui';
const DB_VERSION = 1;
const CONVERSATIONS_STORE = 'conversations';
const MESSAGES_STORE = 'messages';
const SETTINGS_KEY = 'settings';
const ACTIVE_CONVERSATION_KEY = 'activeConversationId';

const defaultSettings: ChatSettings = {
    host: 'http://localhost:11434/api',
    model: 'mistral:latest',
    defaultSystemMessage: '',
};

const nowIso = (): string => {
    return new Date().toISOString();
};

const createId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const openDatabase = (): Promise<ChatDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const database = request.result;

            if (!database.objectStoreNames.contains(CONVERSATIONS_STORE)) {
                const conversations = database.createObjectStore(CONVERSATIONS_STORE, {
                    keyPath: 'id',
                });

                conversations.createIndex('updatedAt', 'updatedAt', { unique: false });
                conversations.createIndex('pinned', 'pinned', { unique: false });
                conversations.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
            }

            if (!database.objectStoreNames.contains(MESSAGES_STORE)) {
                const messages = database.createObjectStore(MESSAGES_STORE, {
                    keyPath: 'id',
                });

                messages.createIndex('conversationId', 'conversationId', { unique: false });
                messages.createIndex('createdAt', 'createdAt', { unique: false });
            }
        };

        request.onsuccess = () => {
            resolve(request.result as ChatDatabase);
        };

        request.onerror = () => {
            reject(request.error ?? new Error('Erro ao abrir IndexedDB'));
        };
    });
};

const readAllFromStore = async <T>(storeName: string): Promise<T[]> => {
    const database = await openDatabase();

    return await new Promise<T[]>((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result as T[]);
        };

        request.onerror = () => {
            reject(request.error ?? new Error('Falha ao ler dados'));
        };

        transaction.oncomplete = () => {
            database.close();
        };

        transaction.onerror = () => {
            database.close();
        };
    });
};

const getFromStore = async <T>(storeName: string, id: string): Promise<T | undefined> => {
    const database = await openDatabase();

    return await new Promise<T | undefined>((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result as T | undefined);
        };

        request.onerror = () => {
            reject(request.error ?? new Error('Falha ao buscar registro'));
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
};

const putInStore = async <T>(storeName: string, value: T): Promise<T> => {
    const database = await openDatabase();

    return await new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => {
            resolve(value);
        };

        request.onerror = () => {
            reject(request.error ?? new Error('Falha ao salvar registro'));
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
};

const deleteFromStore = async (storeName: string, id: string): Promise<void> => {
    const database = await openDatabase();

    return await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(request.error ?? new Error('Falha ao remover registro'));
        };

        transaction.oncomplete = () => {
            database.close();
        };
    });
};

export const createConversationTitle = (): string => {
    return new Intl.DateTimeFormat('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
    }).format(new Date());
};

export const chatStore = {
    createId,
    async getSettings(): Promise<ChatSettings> {
        if (typeof localStorage !== 'undefined') {
            const rawSettings = localStorage.getItem(SETTINGS_KEY);

            if (rawSettings) {
                try {
                    return {
                        ...defaultSettings,
                        ...(JSON.parse(rawSettings) as Partial<ChatSettings>),
                    };
                } catch (error) {
                    // Falls back to defaults when the persisted payload is invalid.
                }
            }
        }

        return defaultSettings;
    },
    async saveSettings(settings: ChatSettings): Promise<ChatSettings> {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }

        return settings;
    },
    async getActiveConversationId(): Promise<string | null> {
        if (typeof localStorage === 'undefined') {
            return null;
        }

        return localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    },
    async setActiveConversationId(id: string | null): Promise<void> {
        if (typeof localStorage === 'undefined') {
            return;
        }

        if (!id) {
            localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
            return;
        }

        localStorage.setItem(ACTIVE_CONVERSATION_KEY, id);
    },
    async listConversations(): Promise<ChatConversation[]> {
        const conversations = await readAllFromStore<ChatConversation>(CONVERSATIONS_STORE);

        return conversations.sort((left, right) => {
            if (left.pinned !== right.pinned) {
                return left.pinned ? -1 : 1;
            }

            const leftTime = left.lastMessageAt || left.updatedAt || left.createdAt;
            const rightTime = right.lastMessageAt || right.updatedAt || right.createdAt;

            return new Date(rightTime).getTime() - new Date(leftTime).getTime();
        });
    },
    async getConversation(id: string): Promise<ChatConversation | undefined> {
        return await getFromStore<ChatConversation>(CONVERSATIONS_STORE, id);
    },
    async upsertConversation(conversation: ChatConversation): Promise<ChatConversation> {
        return await putInStore<ChatConversation>(CONVERSATIONS_STORE, conversation);
    },
    async createConversation(payload: Partial<ChatConversation> = {}): Promise<ChatConversation> {
        const timestamp = nowIso();
        const conversation: ChatConversation = {
            id: payload.id || createId(),
            title: payload.title || createConversationTitle(),
            pinned: payload.pinned ?? false,
            systemMessage: payload.systemMessage ?? '',
            model: payload.model ?? null,
            createdAt: payload.createdAt || timestamp,
            updatedAt: payload.updatedAt || timestamp,
            lastMessageAt: payload.lastMessageAt ?? null,
        };

        await putInStore<ChatConversation>(CONVERSATIONS_STORE, conversation);

        return conversation;
    },
    async deleteConversation(conversationId: string): Promise<void> {
        const messages = await chatStore.listMessages(conversationId);

        for (const message of messages) {
            await deleteFromStore(MESSAGES_STORE, message.id);
        }

        await deleteFromStore(CONVERSATIONS_STORE, conversationId);
    },
    async listMessages(conversationId: string): Promise<ChatMessage[]> {
        const messages = await readAllFromStore<ChatMessage>(MESSAGES_STORE);

        return messages
            .filter((message) => {
                return message.conversationId === conversationId;
            })
            .sort((left, right) => {
                return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
            });
    },
    async saveMessage(message: ChatMessage): Promise<ChatMessage> {
        return await putInStore<ChatMessage>(MESSAGES_STORE, message);
    },
    async createMessage(payload: Omit<ChatMessage, 'id' | 'createdAt'> & { createdAt?: string }): Promise<ChatMessage> {
        const message: ChatMessage = {
            id: createId(),
            conversationId: payload.conversationId,
            role: payload.role,
            content: payload.content,
            model: payload.model,
            createdAt: payload.createdAt || nowIso(),
        };

        await putInStore<ChatMessage>(MESSAGES_STORE, message);

        return message;
    },
    async updateConversation(conversationId: string, patch: Partial<ChatConversation>): Promise<ChatConversation> {
        const currentConversation = await chatStore.getConversation(conversationId);

        if (!currentConversation) {
            throw new Error('Conversa não encontrada');
        }

        const updatedConversation: ChatConversation = {
            ...currentConversation,
            ...patch,
            updatedAt: nowIso(),
        };

        await putInStore<ChatConversation>(CONVERSATIONS_STORE, updatedConversation);

        return updatedConversation;
    },
    async touchConversation(conversationId: string, lastMessageAt: string | null = null): Promise<ChatConversation> {
        return await chatStore.updateConversation(conversationId, {
            lastMessageAt: lastMessageAt || nowIso(),
        });
    },
};
