import type { OllamaRequest, OllamaResponse } from '@/types/ollama';
export type { OllamaRequest, OllamaResponse } from '@/types/ollama';
import axios from 'axios';
import { ifUrl } from '@/utils/data';

export const getBaseUrlFromStorage = () => {
    let defaultValue = 'http://localhost:11434/api';

    if (typeof localStorage !== 'undefined') {
        return ifUrl(localStorage?.getItem('server_base_url'))?.toString() || defaultValue;
    }

    return defaultValue;
};

export const getClient = (baseUrl: string | null = null, timeout: number | null = 120000) => {
    return axios.create({
        baseURL: baseUrl || getBaseUrlFromStorage(),
        timeout: 120000,
    });
};

export const ollamaService = {
    async ask(prompt: string, model = 'mistral', baseUrl: string | null = null): Promise<OllamaResponse> {
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

    async listModels(baseUrl: string | null = null): Promise<string[]> {
        try {
            const client = getClient(baseUrl);
            const response = await client.get('/tags');
            return response.data.models?.map((m: any) => m.name) ?? [];
        } catch (error) {
            console.error('Erro ao listar modelos:', error);
            return [];
        }
    },
};
