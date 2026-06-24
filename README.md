# 💬 Chat com Ollama - Projeto Exemplo

Um projeto Vue 3 + TypeScript que integra com Ollama para chat local com IA.

## 🚀 Quick Start

### 1. Instale as dependências
```bash
npm install
```

### 2. Inicie Ollama (em outro terminal)
```bash
ollama serve
```

Se não tiver Ollama instalado:
```bash
# Baixe o modelo Mistral (recomendado)
ollama pull mistral

# Ou outro modelo
ollama pull neural-chat
ollama pull dolphin-mixtral
```

### 3. Rode o projeto
```bash
npm run dev
```

Acesse: **http://localhost:5173**

## 📁 Estrutura

```
src/
├── App.vue                    # Interface do chat
├── services/
│   └── ollama.ts             # Serviço API do Ollama
├── style.css                 # Tailwind CSS
└── main.ts                   # Entry point
```

## 🎯 Como Funciona

1. **App.vue** - Interface bonita com:
   - Chat em tempo real
   - Seleção de modelo
   - Indicador de carregamento
   - Mensagens com timestamp

2. **ollama.ts** - Serviço que:
   - Conecta à API Ollama em `http://localhost:11434`
   - Envia prompts
   - Lista modelos disponíveis
   - Trata erros

3. **Tailwind CSS** - Estilo responsivo com tema escuro

## ⚙️ Configuração

### Mudar modelo padrão

Edite `src/App.vue`:
```typescript
const selectedModel = ref('neural-chat')  // ao invés de 'mistral'
```

### Mudar URL do Ollama

Edite `src/services/ollama.ts`:
```typescript
const client = axios.create({
  baseURL: 'http://seu-servidor:11434/api',
  timeout: 120000
})
```

## 🔧 Desenvolvimento

```bash
# Dev server com hot reload
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## ⏱️ Primeira Execução

- **1ª mensagem**: Pode demorar 5-10s (carregando modelo na VRAM)
- **Próximas**: ~1-2s por token (dependendo do modelo e hardware)

## 🐛 Troubleshooting

### Erro: "Ollama não está rodando"
```bash
# Verifique se Ollama está ativo
ollama serve
```

### Nenhum modelo aparece
```bash
# Baixe um modelo
ollama pull mistral
```

### Resposta muito lenta
- Use `phi` (mais rápido)
- Use `neural-chat` (balanceado)
- Evite `dolphin-mixtral` em 6GB VRAM

### Conexão recusada
- Confira se Ollama está em `localhost:11434`
- Verifique firewall

## 📦 Stack Usado

- **Vue 3** - Framework UI
- **TypeScript** - Tipagem
- **Vite** - Build tool
- **Tailwind CSS** - Estilo
- **Axios** - HTTP client
- **Ollama** - LLM local

## 📝 Exemplos de Uso

```javascript
// No App.vue

// Fazer pergunta simples
await ollamaService.ask('O que é Vue.js?')

// Com modelo específico
await ollamaService.ask('Explique React', 'neural-chat')

// Listar modelos
const models = await ollamaService.listModels()
```

## 🎓 Próximos Passos

- Adicionar histórico persistente
- Exportar conversa em Markdown
- Suporte para múltiplas conversas
- Streaming de respostas
- Customizar prompt system

---

**Criado com Claude Code** 🤖
