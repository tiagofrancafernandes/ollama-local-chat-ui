# Ollama Proxy

Este projeto contém um proxy HTTP simples para encaminhar requisições para uma instância do Ollama, mesmo quando o cliente acessa o proxy por outro endereço, domínio ou camada de reverse proxy.

O script principal é [`ollama-proxy.js`](./ollama-proxy.js).
O projeto usa ES modules nativos, então o script importa dependências com `import` em vez de `require`.

## O que ele faz

- Recebe requisições em `http://localhost:3000` ou na porta configurada
- Encaminha tudo para o Ollama em `http://localhost:11434` por padrão
- Suporta qualquer rota do Ollama, como:
  - `/api/tags`
  - `/api/generate`
  - `/api/chat`
- Libera CORS para qualquer origem
- Responde `OPTIONS` localmente para funcionar com preflight de navegador

## Requisitos

- Node.js instalado
- Node.js 18 ou superior
- Ollama rodando localmente ou em outro host acessível

## Como usar

### 1. Inicie o Ollama

Por padrão, o proxy espera o Ollama em:

```bash
http://localhost:11434
```

Se o Ollama estiver em outro endereço, ajuste a variável `OLLAMA_HOST`.

### 2. Inicie o proxy

```bash
node ollama-proxy.js
```

Ou use o script do pacote:

```bash
npm start
```

Por padrão, o proxy sobe em:

```bash
http://localhost:3000
```

### 3. Chame o proxy em vez do Ollama direto

Exemplos:

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

## Variáveis de ambiente

### `OLLAMA_HOST`

Define o endereço do Ollama de destino.

Exemplos:

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

Define a porta do proxy HTTP.

Exemplo:

```bash
PORT=4000 npm start
```

### `USE_HTTPS`

Se `true`, o proxy usa `https` para falar com o destino configurado em `OLLAMA_HOST`.

Exemplo:

```bash
USE_HTTPS=true OLLAMA_HOST=https://ollama.example.com npm start
```

## Exemplo com nginx

Se você quiser expor o proxy por um domínio local com SSL, o nginx pode apontar para o Node rodando em `localhost:3000`.

Exemplo:

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

Nesse cenário:

- o navegador acessa `https://local-secure-3000.com`
- o nginx encaminha para `http://localhost:3000`
- o proxy encaminha para o Ollama configurado em `OLLAMA_HOST`

## CORS

O proxy já libera CORS para todas as origens:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`
- `Access-Control-Allow-Headers: *`

Além disso, o método `OPTIONS` é tratado diretamente pelo proxy, o que ajuda em requisições de preflight feitas pelo navegador.

## Observações importantes

- O proxy remove headers sensíveis ao encaminhar para o Ollama, como `Origin` e `Referer`
- Isso reduz a chance de `403 Forbidden` causado por validação de origem
- Se o Ollama estiver em outra máquina ou atrás de outro proxy, verifique se o serviço está acessível pela rede

## Testes rápidos

Verifique a lista de modelos:

```bash
curl http://localhost:3000/api/tags
```

Faça uma geração simples:

```bash
curl http://localhost:3000/api/generate \
    -H 'Content-Type: application/json' \
    -d '{
        "model": "llama3.2",
        "prompt": "Diga olá em uma frase."
    }'
```

## Solução de problemas

### `403 Forbidden`

Verifique:

- se `OLLAMA_HOST` aponta para o destino correto
- se o Ollama está rodando
- se algum proxy intermediário está adicionando ou sobrescrevendo headers
- se o destino exige `https` e `USE_HTTPS=true`

### `404 Not Found`

Normalmente significa que a URL chamada no proxy não existe no Ollama ou foi digitada com erro.

### Erro de CORS no navegador

Se o erro aparece no browser, confira:

- se o browser está chamando o proxy e não o Ollama diretamente
- se o nginx está repassando a resposta sem remover os headers CORS
- se não existe outro proxy na frente removendo os headers
