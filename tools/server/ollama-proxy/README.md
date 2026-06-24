# Ollama Proxy

English documentation is the default.

- Portuguese version: [README.pt-BR.md](./README.pt-BR.md)

This project provides a small HTTP proxy that forwards requests to an Ollama instance from any origin, domain, or reverse proxy layer.

The main script is [`ollama-proxy.js`](./ollama-proxy.js).
The project uses native ES modules, so the script imports dependencies with `import` instead of `require`.

## What it does

- Accepts requests on `http://localhost:3000` or any configured port
- Forwards requests to Ollama at `http://localhost:11434` by default
- Supports any Ollama route, such as:
  - `/api/tags`
  - `/api/generate`
  - `/api/chat`
- Enables CORS for all origins
- Handles `OPTIONS` locally for browser preflight requests

## Requirements

- Node.js installed
- Node.js 18 or newer
- Ollama running locally or on another reachable host

## Usage

### 1. Start Ollama

By default, the proxy expects Ollama at:

```bash
http://localhost:11434
```

If Ollama is running elsewhere, set `OLLAMA_HOST`.

### 2. Start the proxy

```bash
node ollama-proxy.js
```

Or use the package script:

```bash
npm start
```

By default, the proxy listens on:

```bash
http://localhost:3000
```

### 3. Call the proxy instead of Ollama directly

Examples:

```bash
curl http://localhost:3000/api/tags
```

```bash
curl http://localhost:3000/api/generate \
    -H 'Content-Type: application/json' \
    -d '{
        "model": "llama3.2",
        "prompt": "Hello"
    }'
```

## Environment variables

### `OLLAMA_HOST`

Sets the destination Ollama address.

Examples:

```bash
OLLAMA_HOST=http://localhost:11434 npm start
```

```bash
OLLAMA_HOST=http://192.168.0.10:11434 npm start
```

```bash
OLLAMA_HOST=https://ollama.example.com npm start
```

### `PORT`

Sets the proxy port.

Example:

```bash
PORT=4000 npm start
```

### `USE_HTTPS`

If set to `true`, the proxy uses `https` when talking to `OLLAMA_HOST`.

Example:

```bash
USE_HTTPS=true OLLAMA_HOST=https://ollama.example.com npm start
```

## nginx example

If you want to expose the proxy through a local SSL domain, nginx can point to the Node process running on `localhost:3000`.

Example:

```nginx
server {
    listen 443 ssl;
    server_name local-secure-3000.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

In that setup:

- the browser hits `https://local-secure-3000.com`
- nginx forwards to `http://localhost:3000`
- the proxy forwards to Ollama defined by `OLLAMA_HOST`

## CORS

The proxy already allows CORS for all origins:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: *`

The `OPTIONS` method is answered directly by the proxy, which helps browser preflight requests.

## Important notes

- The proxy strips sensitive upstream headers such as `Origin` and `Referer`
- This reduces the chance of `403 Forbidden` caused by origin validation
- If Ollama is on another machine or behind another proxy, make sure it is reachable from this host

## Quick tests

List available models:

```bash
curl http://localhost:3000/api/tags
```

Run a simple generation:

```bash
curl http://localhost:3000/api/generate \
    -H 'Content-Type: application/json' \
    -d '{
        "model": "llama3.2",
        "prompt": "Say hello in one sentence."
    }'
```

## Troubleshooting

### `403 Forbidden`

Check:

- whether `OLLAMA_HOST` points to the correct destination
- whether Ollama is running
- whether an intermediate proxy is adding or rewriting headers
- whether the destination requires `https` and `USE_HTTPS=true`

### `404 Not Found`

Usually means the requested URL does not exist in Ollama or was typed incorrectly.

### Browser CORS error

If the browser still shows a CORS error, verify:

- the browser is calling the proxy, not Ollama directly
- nginx is not stripping the CORS headers
- there is no other proxy in front removing the headers
