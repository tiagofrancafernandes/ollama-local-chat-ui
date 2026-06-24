<script setup lang="ts">
import DOMPurify from 'dompurify';
import MarkdownIt from 'markdown-it';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { toast } from 'vue3-toastify';
import { useRoute, useRouter } from 'vue-router';

import { ollamaService, setBaseUrl } from '@/services/ollama';
import {
    chatStore,
    createConversationTitle,
    type ChatConversation,
    type ChatMessage,
    type ChatSettings,
} from '@/services/chatStore';
import { isUrl } from '@/utils/data';

interface ModelItem {
    name: string;
    size?: number;
    details?: {
        quantization_level?: string;
        parameter_size?: string;
    };
}

const md = new MarkdownIt({
    html: false,
    linkify: true,
    breaks: true,
});

const parseMd = (value: string): string => {
    const rawHtml = md.render(value || '');

    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
            'hr',
            'br',
            'p',
            'a',
            'img',
            'span',
            'pre',
            'code',
            'kbd',
            'ul',
            'ol',
            'li',
            'strong',
            'em',
            'blockquote',
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target', 'rel'],
    });
};

const toIsoTime = (value: string | Date | null): string => {
    if (!value) {
        return '';
    }

    return new Date(value).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const baseUrl = ref('http://localhost:11434/api');
const route = useRoute();
const router = useRouter();
const selectedModel = ref<ModelItem | null>(null);
const models = ref<ModelItem[]>([]);
const settings = ref<ChatSettings>({
    host: 'http://localhost:11434/api',
    model: 'mistral:latest',
    defaultSystemMessage: '',
});

const conversations = ref<ChatConversation[]>([]);
const activeConversation = computed<ChatConversation | null>(() => {
    return conversations.value.find((conversation) => conversation.id === routeConversationId.value) || null;
});

const messages = ref<ChatMessage[]>([]);
const input = ref('');
const isLoading = ref(false);
const sidebarCollapsed = ref(false);
const settingsOpen = ref(false);
const editingConversationTitle = ref<string | null>(null);
const conversationTitleDraft = ref('');
const settingsDraft = ref<ChatSettings>(settings.value);
const conversationSystemDraft = ref('');

const selectedModelName = computed(() => {
    return selectedModel.value?.name || settings.value.model || '';
});

const activeSystemMessage = computed(() => {
    const conversationMessage = activeConversation.value?.systemMessage?.trim();

    if (conversationMessage) {
        return conversationMessage;
    }

    return settings.value.defaultSystemMessage?.trim() || '';
});

const sortedConversations = computed(() => {
    return [...conversations.value].sort((left, right) => {
        if (left.pinned !== right.pinned) {
            return left.pinned ? -1 : 1;
        }

        const leftTime = left.lastMessageAt || left.updatedAt || left.createdAt;
        const rightTime = right.lastMessageAt || right.updatedAt || right.createdAt;

        return new Date(rightTime).getTime() - new Date(leftTime).getTime();
    });
});

const currentConversationTitle = computed(() => {
    return activeConversation.value?.title || 'Nova conversa';
});

const routeConversationId = computed(() => {
    return String(route.params.conversationId || '').trim();
});

const setStatus = (message: string, type: 'error' | 'success' | 'info') => {
    if (!message) {
        return;
    }

    if (type === 'error') {
        toast.error(message);
        return;
    }

    if (type === 'success') {
        toast.success(message);
        return;
    }

    toast.info(message);
};

const refreshConversationList = async () => {
    conversations.value = await chatStore.listConversations();
};

const refreshMessages = async () => {
    if (!routeConversationId.value) {
        messages.value = [];
        return;
    }

    messages.value = await chatStore.listMessages(routeConversationId.value);
};

const createNewConversation = async () => {
    const conversation = await chatStore.createConversation({
        id: chatStore.createId(),
        title: createConversationTitle(),
        model: selectedModelName.value || settings.value.model || null,
        systemMessage: '',
    });

    await router.push({
        name: 'conversation',
        params: {
            conversationId: conversation.id,
        },
    });

    await chatStore.setActiveConversationId(conversation.id);

    await refreshConversationList();
    await refreshMessages();
};

const openConversation = async (conversationId: string) => {
    await router.push({
        name: 'conversation',
        params: {
            conversationId,
        },
    });

    await chatStore.setActiveConversationId(conversationId);
    await refreshMessages();
};

const ensureConversation = async (): Promise<ChatConversation> => {
    if (activeConversation.value) {
        return activeConversation.value;
    }

    const conversation = await chatStore.createConversation({
        id: chatStore.createId(),
        title: createConversationTitle(),
        model: selectedModelName.value || settings.value.model || null,
        systemMessage: '',
    });

    await router.push({
        name: 'conversation',
        params: {
            conversationId: conversation.id,
        },
    });

    await chatStore.setActiveConversationId(conversation.id);
    await refreshConversationList();

    return conversation;
};

const loadModels = async () => {
    try {
        setStatus('Carregando modelos...', 'info');
        const loadedModels = await ollamaService.listModels(baseUrl.value);

        models.value = loadedModels.map((item: string | ModelItem) => {
            if (typeof item === 'string') {
                return { name: item };
            }

            return item;
        });

        if (!selectedModel.value) {
            selectedModel.value =
                models.value.find((item) => item.name === settings.value.model) || models.value[0] || null;
        } else if (selectedModel.value && !models.value.some((item) => item.name === selectedModel.value?.name)) {
            selectedModel.value = models.value[0] || null;
        }

        if (models.value.length === 0) {
            setStatus('Nenhum modelo encontrado. Use: ollama pull mistral', 'error');
            return;
        }

        setStatus(`${models.value.length} modelo(s) disponível(is)`, 'success');
    } catch (error) {
        setStatus(`Erro ao carregar modelos: ${error}`, 'error');
    }
};

const loadSettings = async () => {
    settings.value = await chatStore.getSettings();
    settingsDraft.value = { ...settings.value };
    baseUrl.value = settings.value.host;
    selectedModel.value = models.value.find((item) => item.name === settings.value.model) || selectedModel.value;
    setBaseUrl(settings.value.host);
};

const persistSettings = async () => {
    if (!isUrl(baseUrl.value)) {
        setStatus('Host inválido', 'error');
        return;
    }

    const nextSettings: ChatSettings = {
        host: baseUrl.value,
        model: selectedModelName.value || settings.value.model || 'mistral:latest',
        defaultSystemMessage: settingsDraft.value.defaultSystemMessage,
    };

    settings.value = await chatStore.saveSettings(nextSettings);
    settingsDraft.value = { ...settings.value };
    setBaseUrl(settings.value.host);
    setStatus('Configurações salvas', 'success');
    settingsOpen.value = false;
    await loadModels();
};

const startEditingTitle = (conversation: ChatConversation) => {
    editingConversationTitle.value = conversation.id;
    conversationTitleDraft.value = conversation.title;
};

const saveConversationTitle = async (conversationId: string) => {
    const nextTitle = conversationTitleDraft.value.trim();

    if (!nextTitle) {
        return;
    }

    await chatStore.updateConversation(conversationId, {
        title: nextTitle,
    });

    editingConversationTitle.value = null;
    await refreshConversationList();
};

const togglePinned = async (conversation: ChatConversation) => {
    await chatStore.updateConversation(conversation.id, {
        pinned: !conversation.pinned,
    });

    await refreshConversationList();
};

const saveConversationSystemMessage = async () => {
    if (!activeConversation.value) {
        return;
    }

    await chatStore.updateConversation(activeConversation.value.id, {
        systemMessage: conversationSystemDraft.value.trim(),
    });

    await refreshConversationList();
    setStatus('Mensagem de sistema atualizada', 'success');
};

const removeConversation = async (conversationId: string) => {
    await chatStore.deleteConversation(conversationId);

    if (routeConversationId.value === conversationId) {
        messages.value = [];
    }

    await refreshConversationList();

    if (!routeConversationId.value && conversations.value.length > 0) {
        await openConversation(conversations.value[0].id);
        return;
    }

    if (!routeConversationId.value) {
        await createNewConversation();
    }
};

const sendMessage = async () => {
    if (!input.value.trim() || isLoading.value) {
        return;
    }

    const conversation = await ensureConversation();
    const userPrompt = input.value.trim();
    input.value = '';

    const userMessage = await chatStore.createMessage({
        conversationId: conversation.id,
        role: 'user',
        content: userPrompt,
        model: selectedModelName.value || settings.value.model || null,
    });

    messages.value = [...messages.value, userMessage];
    isLoading.value = true;
    try {
        const history = messages.value
            .filter((message) => message.role !== 'system')
            .map((message) => {
                return `${message.role === 'user' ? 'Usuário' : 'Assistente'}: ${message.content}`;
            })
            .join('\n');

        const promptParts = [
            activeSystemMessage.value ? `Instruções do sistema:\n${activeSystemMessage.value}` : '',
            history,
            `Usuário: ${userPrompt}`,
        ].filter(Boolean);

        const response = await ollamaService.ask(
            promptParts.join('\n\n'),
            selectedModelName.value || settings.value.model || 'mistral:latest',
            baseUrl.value
        );

        const assistantMessage = await chatStore.createMessage({
            conversationId: conversation.id,
            role: 'assistant',
            content: response?.response || '',
            model: response?.model || selectedModelName.value || settings.value.model || null,
        });

        messages.value = [...messages.value, assistantMessage];
        await chatStore.touchConversation(conversation.id, assistantMessage.createdAt);
        await refreshConversationList();
        setStatus('Resposta recebida', 'success');
    } catch (error) {
        const errorMessage = await chatStore.createMessage({
            conversationId: conversation.id,
            role: 'assistant',
            content: `Erro: ${error}`,
            model: selectedModelName.value || settings.value.model || null,
        });

        messages.value = [...messages.value, errorMessage];
        setStatus(`Erro ao enviar mensagem: ${error}`, 'error');
    } finally {
        isLoading.value = false;
        await nextTick();
        scrollToBottom();
    }
};

const scrollToBottom = () => {
    const container = document.querySelector<HTMLElement>('[data-chat-scroll]');

    if (!container) {
        return;
    }

    container.scrollTop = container.scrollHeight;
};

watch(
    () => selectedModel.value?.name,
    async (value) => {
        if (!value) {
            return;
        }

        settings.value = {
            ...settings.value,
            model: value,
        };
    }
);

watch(
    () => activeConversation.value?.id,
    (value) => {
        if (!value) {
            return;
        }

        conversationSystemDraft.value = activeConversation.value?.systemMessage || '';
    }
);

onMounted(async () => {
    await loadSettings();
    await loadModels();
    await refreshConversationList();

    const routeModel = String(route.query.model || '').trim();
    const routePrompt = String(route.query.prompt || route.query.q || '').trim();
    const storedConversationId = await chatStore.getActiveConversationId();

    if (routeModel) {
        settings.value = {
            ...settings.value,
            model: routeModel,
        };
    }

    if (routeConversationId.value) {
        const conversation = await chatStore.getConversation(routeConversationId.value);

        if (conversation) {
            await chatStore.setActiveConversationId(conversation.id);
            await refreshMessages();
        }
    } else if (storedConversationId) {
        const storedConversation = await chatStore.getConversation(storedConversationId);

        if (storedConversation) {
            await openConversation(storedConversation.id);
        }
    } else if (conversations.value.length > 0) {
        await openConversation(conversations.value[0].id);
    } else {
        await createNewConversation();
    }

    if (activeConversation.value) {
        conversationSystemDraft.value = activeConversation.value.systemMessage || '';
    }

    if (routePrompt) {
        input.value = routePrompt;
        await nextTick();
        await sendMessage();
        await router.replace({
            name: 'conversation',
            params: {
                conversationId: routeConversationId.value || activeConversation.value?.id,
            },
        });
    }

    await nextTick();
    scrollToBottom();
});
</script>

<template>
    <div class="h-screen overflow-hidden bg-[#0b0f17] text-slate-100">
        <div class="flex h-screen overflow-hidden">
            <aside
                :class="[
                    'border-r border-white/10 bg-[#0f1623] transition-all duration-300',
                    {
                        'w-20': sidebarCollapsed,
                        'w-80': !sidebarCollapsed,
                    },
                ]"
            >
                <div class="flex h-full flex-col">
                    <div class="border-b border-white/10 p-4">
                        <div class="flex items-center justify-between gap-3">
                            <div v-if="!sidebarCollapsed">
                                <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Ollama local</p>
                                <h1 class="text-lg font-semibold text-white">Chats</h1>
                            </div>
                            <button
                                type="button"
                                @click="sidebarCollapsed = !sidebarCollapsed"
                                class="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10"
                                :aria-label="sidebarCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'"
                            >
                                <span v-if="sidebarCollapsed">›</span>
                                <span v-else>‹</span>
                            </button>
                        </div>

                        <button
                            type="button"
                            @click="createNewConversation"
                            class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                        >
                            <span>+</span>
                            <span v-if="!sidebarCollapsed">Nova conversa</span>
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto p-3">
                        <div
                            v-if="sortedConversations.length === 0"
                            class="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-400"
                        >
                            Nenhuma conversa salva ainda.
                        </div>

                        <div class="space-y-2">
                            <button
                                v-for="conversation in sortedConversations"
                                :key="conversation.id"
                                type="button"
                                @click="openConversation(conversation.id)"
                                :class="[
                                    'group w-full rounded-2xl border px-3 py-3 text-left transition',
                                    {
                                        'border-blue-400/40 bg-blue-500/15': conversation.id === routeConversationId,
                                        'border-white/10 bg-white/5 hover:bg-white/8':
                                            conversation.id !== routeConversationId,
                                    },
                                ]"
                            >
                                <div class="flex items-start gap-3">
                                    <div
                                        class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 text-xs font-semibold text-slate-200"
                                    >
                                        {{ conversation.pinned ? 'P' : conversation.title.slice(0, 2).toUpperCase() }}
                                    </div>

                                    <div v-if="!sidebarCollapsed" class="min-w-0 flex-1">
                                        <div class="flex items-center justify-between gap-2">
                                            <div class="min-w-0">
                                                <p class="truncate text-sm font-medium text-white">
                                                    {{ conversation.title }}
                                                </p>
                                                <p class="text-xs text-slate-400">
                                                    {{ conversation.pinned ? 'Fixada' : 'Recente' }} ·
                                                    {{ toIsoTime(conversation.updatedAt) }}
                                                </p>
                                            </div>

                                            <span
                                                v-if="conversation.pinned"
                                                class="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-200"
                                            >
                                                Topo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div v-if="!sidebarCollapsed" class="border-t border-white/10 p-4 text-xs text-slate-400">
                        Fixadas no topo, depois ordenadas pelas mais recentes.
                    </div>
                </div>
            </aside>

            <main class="relative flex min-w-0 flex-1 flex-col overflow-hidden">
                <header class="sticky top-0 z-10 border-b border-white/10 bg-[#101827]/95 px-4 py-4 backdrop-blur">
                    <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div class="min-w-0">
                            <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Conversa ativa</p>
                            <div class="mt-1 flex flex-wrap items-center gap-3">
                                <h2 class="truncate text-2xl font-semibold text-white">
                                    {{ currentConversationTitle }}
                                </h2>
                                <button
                                    v-if="activeConversation"
                                    type="button"
                                    @click="startEditingTitle(activeConversation)"
                                    class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                    Renomear
                                </button>
                                <button
                                    v-if="activeConversation"
                                    type="button"
                                    @click="togglePinned(activeConversation)"
                                    class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                                >
                                    {{ activeConversation.pinned ? 'Desafixar' : 'Fixar' }}
                                </button>
                            </div>
                            <p class="mt-2 text-sm text-slate-400">
                                Modelo:
                                <span class="text-slate-200">{{ selectedModelName || 'Sem modelo selecionado' }}</span>
                                · Host:
                                <span class="text-slate-200">{{ settings.host }}</span>
                            </p>
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <button
                                type="button"
                                @click="router.push({ name: 'settings' })"
                                class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
                            >
                                Configurações
                            </button>
                            <button
                                type="button"
                                @click="createNewConversation"
                                class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                            >
                                Nova conversa
                            </button>
                        </div>
                    </div>
                </header>

                <section
                    class="grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-hidden p-4 xl:grid-cols-[minmax(0,1fr)_360px]"
                >
                    <div
                        class="flex min-h-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1726] shadow-2xl shadow-black/20"
                    >
                        <div class="border-b border-white/10 px-5 py-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-sm font-medium text-white">Histórico da conversa</p>
                                    <p class="text-xs text-slate-400">{{ messages.length }} mensagem(ns)</p>
                                </div>
                                <p v-if="activeSystemMessage" class="text-xs text-slate-400">System message ativa</p>
                            </div>
                        </div>

                        <div data-chat-scroll class="flex-1 overflow-y-auto px-4 py-5">
                            <div
                                v-if="messages.length === 0"
                                class="flex min-h-[30rem] items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/3 px-6 text-center"
                            >
                                <div class="max-w-md">
                                    <p class="text-xl font-semibold text-white">Comece uma conversa</p>
                                    <p class="mt-2 text-sm text-slate-400">
                                        O histórico vai ser salvo no IndexedDB e separado por conversa.
                                    </p>
                                </div>
                            </div>

                            <div class="space-y-4">
                                <article
                                    v-for="message in messages"
                                    :key="message.id"
                                    :class="[
                                        'flex',
                                        {
                                            'justify-end': message.role === 'user',
                                            'justify-start': message.role !== 'user',
                                        },
                                    ]"
                                >
                                    <div
                                        :class="[
                                            'max-w-[85%] rounded-3xl px-4 py-3 shadow-lg',
                                            {
                                                'rounded-br-md bg-blue-600 text-white': message.role === 'user',
                                                'rounded-bl-md border border-white/10 bg-white/5 text-slate-100':
                                                    message.role !== 'user',
                                            },
                                        ]"
                                    >
                                        <div
                                            v-html="parseMd(message.content)"
                                            data-markdown-type="container"
                                            class="prose prose-invert max-w-none whitespace-pre-wrap text-sm"
                                        ></div>

                                        <div class="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                            <span>{{ toIsoTime(message.createdAt) }}</span>
                                            <span v-if="message.model">· {{ message.model }}</span>
                                        </div>
                                    </div>
                                </article>

                                <div v-if="isLoading" class="flex justify-start">
                                    <div
                                        class="rounded-3xl rounded-bl-md border border-white/10 bg-white/5 px-4 py-3 text-slate-100"
                                    >
                                        <div class="flex gap-2">
                                            <span class="h-2 w-2 animate-bounce rounded-full bg-slate-400"></span>
                                            <span
                                                class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]"
                                            ></span>
                                            <span
                                                class="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]"
                                            ></span>
                                        </div>
                                        <p class="mt-2 text-xs text-slate-400">Pensando...</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="sticky bottom-0 border-t border-white/10 bg-[#0c1320] px-4 py-4">
                            <div class="flex flex-col gap-3 lg:flex-row">
                                <textarea
                                    v-model="input"
                                    :disabled="isLoading"
                                    @keydown.ctrl.enter.prevent="sendMessage"
                                    rows="3"
                                    placeholder="Digite uma mensagem para a conversa atual..."
                                    class="min-h-24 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400/40"
                                ></textarea>

                                <div class="flex flex-row gap-3 lg:flex-col">
                                    <button
                                        type="button"
                                        @click="sendMessage"
                                        :disabled="isLoading || !input.trim()"
                                        class="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-white/10"
                                    >
                                        Enviar
                                    </button>
                                    <button
                                        type="button"
                                        @click="
                                            conversationSystemDraft =
                                                activeConversation?.systemMessage || settings.defaultSystemMessage || ''
                                        "
                                        class="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-200 transition hover:bg-white/10"
                                    >
                                        Reset system
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="flex min-h-0 flex-col gap-4">
                        <div class="rounded-3xl border border-white/10 bg-[#0f1726] p-5">
                            <div class="flex items-center justify-between gap-3">
                                <div>
                                    <p class="text-sm font-medium text-white">Mensagem de sistema da conversa</p>
                                    <p class="mt-1 text-xs text-slate-400">Se vazia, usa o padrão das configurações.</p>
                                </div>
                                <button
                                    type="button"
                                    @click="saveConversationSystemMessage"
                                    class="rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-500"
                                >
                                    Salvar
                                </button>
                            </div>

                            <textarea
                                v-model="conversationSystemDraft"
                                rows="7"
                                class="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                placeholder="Defina instruções específicas para esta conversa..."
                            ></textarea>
                        </div>

                        <div class="rounded-3xl border border-white/10 bg-[#0f1726] p-5">
                            <p class="text-sm font-medium text-white">Ações da conversa</p>
                            <div class="mt-4 grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    @click="activeConversation && togglePinned(activeConversation)"
                                    :disabled="!activeConversation"
                                    class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {{ activeConversation?.pinned ? 'Desafixar' : 'Fixar' }}
                                </button>
                                <button
                                    type="button"
                                    @click="removeConversation(activeConversation?.id || '')"
                                    :disabled="!activeConversation"
                                    class="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Excluir
                                </button>
                            </div>
                        </div>

                        <div class="rounded-3xl border border-white/10 bg-[#0f1726] p-5 text-sm text-slate-300">
                            <p class="font-medium text-white">Status</p>
                            <div class="mt-4 space-y-2 text-xs text-slate-400">
                                <p>Host atual: {{ settings.host }}</p>
                                <p>Modelo padrão: {{ settings.model }}</p>
                                <p>System default: {{ settings.defaultSystemMessage || 'vazio' }}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div v-if="route.name === 'settings' || settingsOpen" class="absolute inset-0 z-20 bg-black/50 p-4 backdrop-blur-sm">
                    <div
                        class="mx-auto mt-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f1726] p-6 shadow-2xl"
                    >
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-xs uppercase tracking-[0.24em] text-slate-400">Configurações</p>
                                <h3 class="text-xl font-semibold text-white">Modelo, host e system default</h3>
                            </div>
                            <button
                                type="button"
                                @click="
                                    router.push(
                                        routeConversationId
                                            ? { name: 'conversation', params: { conversationId: routeConversationId } }
                                            : { name: 'home' },
                                    )
                                "
                                class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                            >
                                Fechar
                            </button>
                        </div>

                        <div class="mt-6 grid gap-4">
                            <label class="grid gap-2">
                                <span class="text-sm text-slate-300">Host</span>
                                <input
                                    v-model="baseUrl"
                                    type="url"
                                    class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                                    placeholder="http://localhost:11434/api"
                                />
                            </label>

                            <label class="grid gap-2">
                                <span class="text-sm text-slate-300">Modelo padrão</span>
                                <select
                                    v-model="selectedModel"
                                    class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                                >
                                    <option v-for="model in models" :key="model.name" :value="model">
                                        {{ model.name }}
                                    </option>
                                </select>
                            </label>

                            <label class="grid gap-2">
                                <span class="text-sm text-slate-300">Mensagem de sistema padrão</span>
                                <textarea
                                    v-model="settingsDraft.defaultSystemMessage"
                                    rows="6"
                                    class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                                    placeholder="Ex.: Você é um assistente direto, objetivo e técnico."
                                ></textarea>
                            </label>
                        </div>

                        <div class="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                @click="
                                    router.push(
                                        routeConversationId
                                            ? { name: 'conversation', params: { conversationId: routeConversationId } }
                                            : { name: 'home' },
                                    )
                                "
                                class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                @click="persistSettings"
                                class="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>

                <div v-if="editingConversationTitle" class="absolute inset-0 z-30 bg-black/50 p-4 backdrop-blur-sm">
                    <div
                        class="mx-auto mt-24 w-full max-w-lg rounded-3xl border border-white/10 bg-[#0f1726] p-6 shadow-2xl"
                    >
                        <h3 class="text-xl font-semibold text-white">Renomear conversa</h3>
                        <input
                            v-model="conversationTitleDraft"
                            @keydown.enter.prevent.stop="saveConversationTitle(editingConversationTitle)"
                            type="text"
                            class="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                        />

                        <div class="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                @click="editingConversationTitle = null"
                                class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                @click="saveConversationTitle(editingConversationTitle)"
                                class="rounded-2xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>
</template>
