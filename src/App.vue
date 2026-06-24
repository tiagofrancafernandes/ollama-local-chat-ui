<script setup lang="ts">
import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

// Initialize markdown-it with security defaults
const md = new MarkdownIt({
    html: false, // Disables raw HTML input within markdown for safety
    linkify: true, // Automatically converts text URLs into clickable <a> tags
    breaks: true, // Converts simple line breaks into <br> tags
});

const parseMd = (value: any) => {
    const rawHtml = md.render(typeof value === 'string' ? value : '');

    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['hr', 'br', 'p', 'a', 'img', 'span', 'pre', 'code', 'kbd', 'a'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target'],
    });
};

// const rawMarkdown = '# Native Markdown\nParsing with *markdown-it*.'

// Safely compute the HTML output
// const renderedHtml = computed(() => parseMd(rawMarkdown))

import { ref, onMounted, nextTick } from 'vue';
import { ollamaService } from './services/ollama';
import type { OllamaRequest, OllamaResponse } from '@/types/ollama';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    text: string;
    model?: string;
    timestamp: Date | string;
}

const demoResponses = ref<OllamaResponse[]>([
    {
        model: 'deepseek-r1:1.5b',
        created_at: '2026-06-24T05:54:19.242648552Z',
        response: '¡Hola! ¿En qué puedo ayudarte hoy? 😊',
        done: true,
        done_reason: 'stop',
        context: [
            151644, 337, 1953, 151645, 151648, 271, 151649, 271, 39832, 68012, 0, 28286, 1702, 42288, 80815, 58137,
            19840, 48741, 30, 26525, 232,
        ],
        total_duration: 694568631,
        load_duration: 119811920,
        prompt_eval_count: 5,
        prompt_eval_duration: 43991876,
        eval_count: 18,
        eval_duration: 508970317,
    },
    {
        model: 'mistral:latest',
        created_at: '2026-06-24T06:10:19.828675941Z',
        response:
            " Um exemplo de uso do `for...of` para iterar sobre um array em JavaScript é:\n\n```javascript\nlet fruits = ['apple', 'banana', 'orange'];\n\nfor (let fruit of fruits) {\n  console.log(fruit);\n}\n```\n\nNeste exemplo, o `for...of` é usado para iterar sobre cada item no array `fruits`. O loop irá executar três vezes (uma vez por cada item do array), e imprimirá cada fruta no console. É um loop muito fácil de entender e usar, pois ele se comporta similarmente aos loops em outras linguagens de programação como C++ ou Python.",
        done: true,
        done_reason: 'stop',
        context: [
            3, 29473, 1296, 1049, 29644, 3973, 19456, 29477, 1108, 1122, 1070, 1108, 3061, 1645, 1229, 1262, 16135, 4,
            29473, 13282, 19456, 29477, 1108, 28195, 1279, 2320, 2160, 1869, 1777, 29600, 3414, 7622, 1051, 8237, 3973,
            3061, 1645, 27049, 2001, 29515, 781, 781, 14708, 29600, 20936, 781, 1663, 22334, 1095, 6704, 24943, 1415,
            1232, 4395, 3006, 1415, 1232, 1039, 1677, 9921, 781, 781, 2160, 1093, 1663, 11375, 1070, 22334, 29499, 1139,
            781, 29473, 6689, 29491, 2350, 29500, 29490, 7192, 1112, 781, 29520, 781, 14708, 29600, 781, 781, 29527,
            8707, 19456, 29477, 29493, 1057, 2320, 2160, 1869, 1777, 29600, 2001, 1360, 2220, 3414, 7622, 1051, 8237,
            14918, 3283, 1476, 3061, 2320, 29490, 1319, 1814, 10197, 1219, 8638, 4907, 29588, 5314, 1051, 1235, 17962,
            10821, 1042, 1093, 10857, 10821, 2727, 14918, 3283, 1279, 3061, 1325, 1085, 1271, 16647, 1129, 29588, 14918,
            1872, 12241, 1476, 6689, 29491, 5694, 3973, 8638, 9221, 3836, 1053, 29588, 5640, 1108, 1704, 3109, 1085,
            1360, 1051, 29493, 2395, 1046, 6707, 1195, 28260, 29476, 4452, 5147, 1032, 1153, 29241, 1645, 1343, 6663,
            24785, 1125, 1364, 1108, 2775, 10192, 3886, 1102, 2448, 4234, 22134, 29491,
        ],
        total_duration: 24621005068,
        load_duration: 3390438864,
        prompt_eval_count: 19,
        prompt_eval_duration: 862242288,
        eval_count: 166,
        eval_duration: 20321344250,
    },
]);

const demoMessages = ref<Message[]>([
    {
        id: 1,
        role: 'user',
        model: 'deepseek-r1:1.5b',
        timestamp: '2026-06-24T05:54:18.242648552Z',
        text: 'Olá',
    },
    {
        id: 2,
        role: 'assistant',
        model: 'deepseek-r1:1.5b',
        timestamp: '2026-06-24T05:54:19.242648552Z',
        text: 'Olá! Em que posso te ajudar? 😊',
    },
    {
        id: 3,
        role: 'user',
        text: 'me dê um exemplo de for of de array em javascript',
        timestamp: '2026-06-24T05:54:19.242648552Z',
        model: 'deepseek-r1:1.5b',
    },

    {
        id: 4,
        role: 'assistant',
        model: 'mistral:latest',
        timestamp: '2026-06-24T06:10:19.828675941Z',
        text: " Um exemplo de uso do `for...of` para iterar sobre um array em JavaScript é:\n\n```javascript\nlet fruits = ['apple', 'banana', 'orange'];\n\nfor (let fruit of fruits) {\n  console.log(fruit);\n}\n```\n\nNeste exemplo, o `for...of` é usado para iterar sobre cada item no array `fruits`. O loop irá executar três vezes (uma vez por cada item do array), e imprimirá cada fruta no console. É um loop muito fácil de entender e usar, pois ele se comporta similarmente aos loops em outras linguagens de programação como C++ ou Python.",
    },
]);

const input = ref('');
const messages = ref<Message[]>([]);
const loading = ref(false);
const status = ref('');
const statusType = ref<'error' | 'success' | 'info'>('info');
const selectedModel = ref('mistral');
const models = ref<string[]>([]);
let messageCounter = 0;

const formatTime = (date: Date | string | null) => {
    if (!date) {
        return null;
    }

    return new Date(date)?.toLocaleTimeString('pt-BR', {
        hour12: false,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};

const loadModels = async () => {
    try {
        setStatus('Carregando modelos...', 'info');
        const loadedModels = await ollamaService.listModels();
        if (loadedModels.length > 0) {
            models.value = loadedModels;
            if (!selectedModel.value || !loadedModels.includes(selectedModel.value)) {
                selectedModel.value = loadedModels[0];
            }
            setStatus(`${loadedModels.length} modelo(s) disponível(is)`, 'success');
        } else {
            setStatus('Nenhum modelo encontrado. Use: ollama pull mistral', 'error');
        }
    } catch (error) {
        setStatus(`Erro ao carregar modelos: ${error}`, 'error');
    }
};

const send = async () => {
    if (!input.value.trim() || loading.value) return;

    const userMessage = input.value.trim();
    input.value = '';

    messages.value.push({
        id: ++messageCounter,
        role: 'user',
        text: userMessage,
        model: `${selectedModel.value}`,
        timestamp: new Date(),
    });

    loading.value = true;
    setStatus('', 'info');

    try {
        const response = await ollamaService.ask(userMessage, selectedModel.value);
        messages.value.push({
            id: ++messageCounter,
            role: 'assistant',
            text: response?.response || '',
            model: response?.model || '',
            timestamp: new Date(),
        });
        setStatus('✅ Resposta recebida', 'success');
    } catch (error) {
        setStatus(`❌ ${error}`, 'error');
        messages.value.push({
            id: ++messageCounter,
            role: 'assistant',
            text: `Erro: ${error}`,
            timestamp: new Date(),
        });
    } finally {
        loading.value = false;
        await nextTick();
        scrollToBottom();
    }
};

const scrollToBottom = () => {
    const messagesDiv = document.querySelector('.overflow-y-auto');
    if (messagesDiv) {
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
};

const setStatus = (msg: string, type: 'error' | 'success' | 'info') => {
    status.value = msg;
    statusType.value = type;
};

const loadPreviousMessages = async () => {
    for (const item of demoMessages.value) {
        messages.value.push({
            id: ++messageCounter,
            text: item?.text,
            role: item?.role || 'assistant',
            model: item?.model,
            timestamp: item?.timestamp ? new Date(item?.timestamp) : new Date(),
        });
    }
};

onMounted(async () => {
    loadModels();
    loadPreviousMessages();
});
</script>

<style scoped>
textarea {
    font-family: inherit;
}
</style>

<template>
    <div class="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
        <div class="container mx-auto max-w-7xl p-4">
            <!-- Header -->
            <div class="mb-8 pt-8">
                <h1 class="text-4xl font-bold text-white mb-2">💬 Chat com Ollama</h1>
                <p class="text-slate-400">Usando modelo {{ selectedModel }} rodando localmente</p>
            </div>

            <!-- Status -->
            <div
                v-if="status"
                :class="[
                    'mb-4 p-4 rounded-lg text-sm font-medium',
                    {
                        'bg-red-900/30 text-red-200 border border-red-700': statusType === 'error',
                        'bg-green-900/30 text-green-200 border border-green-700': statusType === 'success',
                        'bg-blue-900/30 text-blue-200 border border-blue-700': statusType === 'info',
                    },
                ]"
            >
                {{ status }}
            </div>

            <div class="flex gap-6 mb-3 justify-between">
                <div class="w-7/12 flex gap-4 justify-between">
                    <div class="w-full flex gap-2">
                        <input
                            type="text"
                            url=""
                            placeholder="http://localhost:11434/api"
                            class="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="button"
                            class="w-2/12 px-3 py-2 bg-slate-700 text-slate-300 rounded text-sm border border-slate-600 hover:bg-slate-600 disabled:opacity-50 transition"
                        >
                            Ok
                        </button>
                    </div>
                </div>

                <div class="flex gap-2 justify-between">
                    <select
                        v-model="selectedModel"
                        :disabled="loading"
                        class="w-10/12 px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                        <option v-for="model in models" :key="model" :value="model">
                            {{ model }}
                        </option>
                    </select>

                    <button
                        @click="loadModels"
                        :disabled="loading"
                        class="px-3 py-2 bg-slate-700 text-slate-300 rounded text-sm border border-slate-600 hover:bg-slate-600 disabled:opacity-50 transition"
                    >
                        🔄 Recarregar
                    </button>
                </div>
            </div>

            <!-- Chat Area -->
            <div
                class="bg-slate-800 rounded-lg shadow-xl border border-slate-700 overflow-hidden flex flex-col h-[600px]"
            >
                <!-- Messages -->
                <div class="flex-1 overflow-y-auto p-6 space-y-4">
                    <div v-if="messages.length === 0" class="flex items-center justify-center h-full text-slate-400">
                        <div class="text-center">
                            <p class="text-lg mb-2">👋 Comece a conversar</p>
                            <p class="text-sm">Digite uma mensagem e clique em "Enviar"</p>
                        </div>
                    </div>

                    <div
                        v-for="msg in messages"
                        :key="msg.id"
                        :class="['flex', msg.role === 'user' ? 'justify-end' : 'justify-start']"
                    >
                        <div
                            :class="[
                                'max-w-xs lg:max-w-md px-4 py-3 rounded-lg',
                                {
                                    'bg-blue-600 text-white rounded-br-none': msg.role === 'user',
                                    'bg-slate-900 text-slate-100 rounded-bl-none': msg.role !== 'user',
                                },
                            ]"
                        >
                            <div
                                v-html="parseMd(msg.text || '')"
                                data-markdown-type="container"
                                class="prose max-w-none text-sm text-gray-100 whitespace-pre-wrap"
                            ></div>

                            <p
                                :class="[
                                    'text-xs mt-1 opacity-70 flex gap-2 align-middle content-center justify-between pt-1',
                                    // msg.role === 'user' ? 'justify-end' : 'justify-start',
                                    {
                                        // 'justify-start': msg.role === 'user',
                                        // 'justify-end': msg.role !== 'user',
                                        'flex-row-reverse': msg.role !== 'user',
                                    },
                                ]"
                            >
                                <span class="text-xs opacity-70 italic">
                                    {{ formatTime(msg.timestamp) }}
                                </span>
                                <span class="text-xs opacity-70 italic">
                                    {{ msg?.model }}
                                </span>
                            </p>
                        </div>
                    </div>

                    <!-- Loading indicator -->
                    <div v-if="loading" class="flex justify-start">
                        <div class="bg-slate-700 text-slate-100 px-4 py-3 rounded-lg rounded-bl-none">
                            <div class="flex space-x-2">
                                <div class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div
                                    class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                    style="animation-delay: 0.1s"
                                ></div>
                                <div
                                    class="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                                    style="animation-delay: 0.2s"
                                ></div>
                            </div>
                            <p class="text-xs mt-2 text-slate-400">Pensando...</p>
                        </div>
                    </div>
                </div>

                <!-- Input Area -->
                <div class="border-t border-slate-700 p-4 bg-slate-900">
                    <div class="flex gap-2">
                        <textarea
                            v-model="input"
                            @keydown.enter.ctrl="send"
                            :disabled="loading"
                            placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
                            class="flex-1 px-4 py-2 bg-slate-700 text-white rounded border border-slate-600 focus:border-blue-500 focus:outline-none resize-none disabled:opacity-50"
                            rows="3"
                        ></textarea>
                        <button
                            @click="send"
                            :disabled="loading || !input.trim()"
                            class="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition whitespace-nowrap"
                        >
                            <span>{{ loading ? '⏳' : '📤' }}</span>
                            <span>Enviar</span>
                            <span class="italic text-gray-400 font-light">Ctrl+Enter</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Info -->
            <div class="mt-6 text-xs text-slate-400 bg-slate-900/50 p-4 rounded border border-slate-700">
                <p>
                    💡
                    <strong>Dica:</strong>
                    Ollama deve estar rodando com
                    <code class="bg-slate-800 px-1 py-0.5 rounded">ollama serve</code>
                </p>
                <p>
                    ⏱️
                    <strong>Primeira resposta:</strong>
                    Pode levar alguns segundos (carregando modelo na VRAM)
                </p>
            </div>
        </div>
    </div>
</template>
