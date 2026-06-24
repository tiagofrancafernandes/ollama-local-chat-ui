<script setup lang="ts">
// import { computed } from 'vue';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';

import { ref, onMounted, nextTick, computed, watch } from 'vue';
import { getModel, ollamaService, setModel } from '@/services/ollama';
import { formatBytes, isUrl } from '@/utils/data';
import { getBaseUrl, setBaseUrl } from '@/services/ollama';

const baseUrl = ref<string | null>(null);
const currentModel = ref<string | null>(null);

// Initialize markdown-it with security defaults
const md = new MarkdownIt({
    html: false, // Disables raw HTML input within markdown for safety
    linkify: true, // Automatically converts text URLs into clickable <a> tags
    breaks: true, // Converts simple line breaks into <br> tags
});

const parseMd = (value: any) => {
    const rawHtml = md.render(typeof value === 'string' ? value : '');

    return DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: ['hr', 'br', 'p', 'a', 'img', 'span', 'pre', 'code', 'kbd'],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'target'],
    });
};

// const rawMarkdown = '# Native Markdown\nParsing with *markdown-it*.'

// Safely compute the HTML output
// const renderedHtml = computed(() => parseMd(rawMarkdown))

interface Message {
    id: number;
    role: 'user' | 'assistant';
    text: string;
    model?: string;
    timestamp: Date | string;
}

const handleSetBaseUrl = (e: Event) => {
    if (!isUrl(baseUrl.value)) {
        return;
    }

    setBaseUrl(baseUrl.value);
    loadModels();
};

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
const selectedModel = ref<any>(null);
const selectedModelName = computed(() => selectedModel.value?.name);
const models = ref<any[]>([]);
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
        const loadedModels = await ollamaService.listModels(baseUrl.value);
        if (loadedModels.length > 0) {
            models.value = loadedModels;
            if (!selectedModelName.value || !loadedModels.includes(selectedModelName.value)) {
                selectedModel.value = loadedModels[0] || null;
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
        model: `${selectedModelName.value}`,
        timestamp: new Date(),
    });

    loading.value = true;
    setStatus('', 'info');

    try {
        const response = await ollamaService.ask(userMessage, selectedModelName.value);
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

watch(
    () => selectedModel.value,
    (newValue, oldValue) => {
        console.log('changed value', { newValue, oldValue });
        setModel(newValue?.name);
    }
    // { deep: true }
);

const loadCurrentModel = async () => {
    let _currentModel = getModel() || currentModel.value;

    if (!models.value?.length) {
        await loadModels();
    }

    console.log('models.value?.length', models.value?.length, models.value);

    _currentModel = String(_currentModel || '')?.trim();

    if (_currentModel) {
        let _currentModelData = models.value?.find((item: any) => {
            return item?.name === _currentModel;
        })

        if (_currentModelData) {
            selectedModel.value = _currentModelData
        }

        console.log('_currentModelData', _currentModelData);
        //
    }

    console.log('_currentModel', _currentModel);
    currentModel.value = _currentModel || currentModel.value || getModel();
    console.log('currentModel.value', currentModel.value);

    setModel(_currentModel || null);
};

onMounted(async () => {
    baseUrl.value = getBaseUrl();
    await loadCurrentModel();

    if (!models.value?.length) {
        loadModels();
    }

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
                <div class="text-slate-400 flex flex-row gap-2 flex-wrap min-h-12 justify-between align-middle">
                    <div class="w-full md:w-5/12 border border-gray-600 rounded-sm py-1 px-2">
                        <span class="pe-2">Base URL:</span>
                        <span class="select-all text-white">{{ baseUrl }}</span>
                    </div>

                    <div class="w-full md:w-6/12 border border-gray-600 rounded-sm py-1 px-2">
                        <span class="pe-2">Selected model:</span>
                        <span class="text-white">{{ selectedModel?.name }}</span>
                    </div>

                    <div class="w-full md:w-3/12 border border-gray-600 rounded-sm py-1 px-2">
                        <span class="pe-2">Quantization level:</span>
                        <span class="text-white">
                            {{
                                selectedModel?.details?.quantization_level
                                    ? `(${selectedModel?.details?.quantization_level})`
                                    : ''
                            }}
                        </span>
                    </div>

                    <div class="w-full md:w-3/12 border border-gray-600 rounded-sm py-1 px-2">
                        <span class="pe-2">Parameter size:</span>
                        <span class="text-white">
                            {{
                                selectedModel?.details?.parameter_size
                                    ? `(${selectedModel?.details?.parameter_size})`
                                    : ''
                            }}
                        </span>
                    </div>

                    <div class="w-full md:w-3/12 border border-gray-600 rounded-sm py-1 px-2">
                        <span class="pe-2">Image size:</span>
                        <span class="text-white">
                            {{
                                selectedModel?.size
                                    ? `${formatBytes(selectedModel?.size) || '-'}`
                                    : ''
                            }}
                        </span>
                    </div>
                </div>
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
                <div class="w-8/12 flex gap-4 justify-between">
                    <div class="w-full flex gap-2">
                        <input
                            type="url"
                            v-model="baseUrl"
                            placeholder="http://localhost:11434/api"
                            @keydown.prevent.enter="handleSetBaseUrl"
                            class="w-full px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                        />
                        <button
                            type="button"
                            :disabled="!isUrl(baseUrl)"
                            @click.prevent.stop="handleSetBaseUrl"
                            :class="[
                                'w-2/12 px-3 py-2 text-slate-300 rounded text-sm border border-slate-600 hover:bg-slate-600 disabled:opacity-50 transition',
                                {
                                    'bg-slate-700/30 opacity-30 cursor-not-allowed': !isUrl(baseUrl),
                                    'bg-slate-700': isUrl(baseUrl),
                                },
                            ]"
                        >
                            Ok
                        </button>
                    </div>
                </div>

                <div class="w-full flex gap-2 justify-between">
                    <select
                        v-model="selectedModel"
                        :disabled="loading"
                        class="w-10/12 px-3 py-2 bg-slate-700 text-white rounded text-sm border border-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
                    >
                        <option v-for="model in models" :key="model" :value="model">
                            {{
                                model?.details?.quantization_level
                                    ? `${model?.name}:${model?.details?.quantization_level}`
                                    : model?.name
                            }}
                            {{ model?.details?.parameter_size ? `(${model?.details?.parameter_size})` : '' }}
                            {{ model?.details?.parameter_size ? `${formatBytes(model?.size) || '-'}` : '' }}
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
                            :class="[
                                'px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition whitespace-nowrap',
                                {
                                    'bg-slate-700/30 opacity-30 cursor-not-allowed':
                                        !isUrl(baseUrl) || loading || !input.trim(),
                                    'bg-slate-700': isUrl(baseUrl) && !loading && input.trim(),
                                },
                            ]"
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
