import type { OllamaResponse } from '@/types/ollama';
export type { OllamaRequest, OllamaResponse } from '@/types/ollama';
import axios from 'axios';
import { ifUrl, isUrl } from '@/utils/data';

const defaultBaseUrl: string = 'http://localhost:11434/api';
const defaultModel: string | null = 'mistral:latest';

let serverBaseUrl: string | undefined | null = defaultBaseUrl;
let currentModel: string | undefined | null = defaultModel;

export const getBaseUrl = (): string | null => {
    if (typeof localStorage !== 'undefined') {
        return String(ifUrl(localStorage?.getItem('server_base_url'), true) || serverBaseUrl) || defaultBaseUrl;
    }

    return defaultBaseUrl;
};

export const setBaseUrl = (baseUrl: URL | string | null | undefined = null) => {
    if (!isUrl(baseUrl)) {
        return;
    }

    baseUrl =
        ifUrl(baseUrl)?.toString() ||
        serverBaseUrl ||
        ifUrl(localStorage?.getItem('server_base_url'))?.toString() ||
        defaultBaseUrl;

    serverBaseUrl =
        ifUrl(localStorage?.getItem('server_base_url'))?.toString() ||
        ifUrl(serverBaseUrl as string | null)?.toString() ||
        defaultBaseUrl;

    if (typeof localStorage !== 'undefined') {
        localStorage?.setItem('server_base_url', serverBaseUrl);
    }
};

export const getModel = (): string | null => {
    if (typeof localStorage !== 'undefined') {
        return String(localStorage?.getItem('model'))?.trim() || currentModel || defaultModel;
    }

    return currentModel || defaultModel;
};

export const setModel = (model: string | null | undefined = null) => {
    if (!isUrl(model)) {
        return;
    }

    model = String(model)?.trim() || currentModel || String(localStorage?.getItem('model'))?.trim() || defaultModel;

    currentModel = String(model)?.trim() || defaultModel;

    if (typeof localStorage !== 'undefined') {
        localStorage?.setItem('model', currentModel);
    }
};

export const getClient = (baseUrl: URL | string | null | undefined = null, timeout: number | null = 120000) => {
    return axios.create({
        baseURL: String(ifUrl(baseUrl, true) || getBaseUrl()),
        timeout: timeout ?? 120000,
    });
};

export const ollamaService = {
    async ask(
        prompt: string,
        model = 'mistral',
        baseUrl: URL | string | null | undefined = null
    ): Promise<OllamaResponse> {
        try {
            const client = getClient(baseUrl);

            const response = await client.post<OllamaResponse>('/generate', {
                model,
                prompt,
                stream: false,
            });

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Ollama não está rodando. Inicie com: ollama serve');
                }
                throw new Error(`Erro: ${error.message}`);
            }
            throw error;
        }
    },

    async listModels(baseUrl: URL | string | null | undefined = null): Promise<string[]> {
        try {
            const client = getClient(baseUrl);
            const response = await client.get('/tags');
            // return response.data.models?.map((m: any) => m.name) ?? [];
            return response.data.models ?? [];
        } catch (error) {
            console.error('Erro ao listar modelos:', error);
            return [];
        }
    },
};
