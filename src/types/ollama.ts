/**
 * Represents the response returned by the Ollama API after processing a prompt.
 */
export interface OllamaResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    done_reason: string;
    context: number[];
    total_duration: number;
    load_duration: number;
    prompt_eval_count: number;
    prompt_eval_duration: number;
    eval_count: number;
    eval_duration: number;
}

/**
 * Represents the payload sent to the Ollama API to generate a completion.
 */
export interface OllamaRequest {
    model: string;
    prompt: string;
    stream?: boolean;
    context?: number[];
    options?: OllamaOptions;
}

/**
 * Represents optional generation parameters for the Ollama API.
 */
export interface OllamaOptions {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
}
