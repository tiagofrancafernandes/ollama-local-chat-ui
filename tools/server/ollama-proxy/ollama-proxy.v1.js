#!/usr/bin/env node

const http = require('http');
const https = require('https');
const { URL } = require('url');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const USE_HTTPS = process.env.USE_HTTPS === 'true';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const REQUEST_TIMEOUT_MS = 30000;
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': '*',
};
const HOP_BY_HOP_HEADERS = new Set([
    'connection',
    'keep-alive',
    'origin',
    'referer',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
    'upgrade',
]);

function buildProxyHeaders(reqHeaders, targetHost) {
    const headers = {};

    for (const [name, value] of Object.entries(reqHeaders)) {
        if (HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
            continue;
        }

        headers[name] = value;
    }

    headers.host = targetHost;

    return headers;
}

function sendCorsResponse(res, statusCode, statusMessage, body) {
    if (!res.headersSent) {
        res.writeHead(statusCode, statusMessage, CORS_HEADERS);
    }

    res.end(body);
}

const server = http.createServer((req, res) => {
    let timeoutId = null;
    let requestFinished = false;

    try {
        if ((req.method || 'GET').toUpperCase() === 'OPTIONS') {
            sendCorsResponse(res, 204, 'No Content', '');
            return;
        }

        const requestPath = req.url || '/';
        const requestMethod = req.method || 'GET';
        const ollamaUrl = new URL(requestPath, OLLAMA_HOST);
        const client = USE_HTTPS ? https : http;
        const proxyHeaders = buildProxyHeaders(req.headers, ollamaUrl.host);

        const proxyRequest = client.request(
            {
                protocol: ollamaUrl.protocol,
                hostname: ollamaUrl.hostname,
                port: ollamaUrl.port,
                path: `${ollamaUrl.pathname}${ollamaUrl.search}`,
                method: requestMethod,
                headers: proxyHeaders,
            },
            (proxyResponse) => {
                if (timeoutId !== null) {
                    clearTimeout(timeoutId);
                    timeoutId = null;
                }

                res.writeHead(proxyResponse.statusCode || 502, {
                    ...CORS_HEADERS,
                    ...proxyResponse.headers,
                });

                proxyResponse.pipe(res);
            }
        );

        timeoutId = setTimeout(() => {
            if (requestFinished) {
                return;
            }

            requestFinished = true;
            proxyRequest.destroy(new Error('Request timed out'));

            if (!res.headersSent) {
                res.writeHead(504, 'Gateway Timeout', CORS_HEADERS);
            }

            res.end('Timeout: A requisição excedeu o tempo limite de 30 segundos.');
        }, REQUEST_TIMEOUT_MS);

        proxyRequest.on('error', (error) => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
            }

            if (requestFinished) {
                return;
            }

            requestFinished = true;

            if (!res.headersSent) {
                res.writeHead(500, 'Erro ao conectar com o Ollama', CORS_HEADERS);
            }

            res.end(`Erro: ${error.message}`);
        });

        req.pipe(proxyRequest);
    } catch (error) {
        if (!res.headersSent) {
            res.writeHead(500, 'Erro interno no servidor', CORS_HEADERS);
        }

        res.end(`Erro: ${error.message}`);
    }
});

server.listen(PORT, () => {
    console.log(`Proxy rodando em http://localhost:${PORT}, encaminhando para ${OLLAMA_HOST}`);
});
