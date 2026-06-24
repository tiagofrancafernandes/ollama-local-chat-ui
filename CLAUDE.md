# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ollama Local Chat UI** is a Vue 3 + TypeScript chat application that integrates with Ollama for local LLM inference. It provides a modern web interface to interact with locally-running language models.

### Tech Stack
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** as build tool
- **Tailwind CSS v4** with Forms and Typography plugins
- **Axios** for HTTP requests
- **Markdown-it** for markdown rendering
- **DOMPurify** for XSS protection
- **Ollama API** for local LLM inference

## Development Commands

```bash
# Install dependencies
npm install

# Start dev server (Vite with hot reload)
npm run dev
# Default port: 5173 (or custom via APP_PORT env var)

# Build for production
npm run build
# Runs: vue-tsc -b && vite build

# Preview production build
npm run preview
```

## Architecture & Key Patterns

### Project Structure

```
src/
├── App.vue                 # Main chat interface (single SFC)
├── main.ts                 # Vue app entry point
├── style.css               # Global Tailwind CSS config
├── components/             # Reusable Vue components
├── services/
│   └── ollama.ts           # Ollama API client (singleton service pattern)
├── types/
│   └── ollama.ts           # TypeScript interfaces for Ollama API
├── utils/
│   └── data.ts             # URL validation utilities
├── helpers/                # (empty - reserved for helpers)
└── assets/                 # (empty - reserved for static assets)
```

### Core Patterns

#### 1. **Service Layer (services/ollama.ts)**
- **Pattern**: Singleton service exported as `ollamaService` object
- **Key exports**:
  - `getClient(baseUrl?, timeout?)` - Creates axios instance with configurable Ollama server URL
  - `getBaseUrlFromStorage()` - Reads Ollama server URL from localStorage (default: `http://localhost:11434/api`)
  - `ollamaService.ask(prompt, model, baseUrl?)` - Sends prompt to Ollama and returns response
  - `ollamaService.listModels(baseUrl?)` - Fetches available models from Ollama
- **Error Handling**: Catches connection errors and throws user-friendly messages

#### 2. **Type Definitions (types/ollama.ts)**
Three main interfaces:
- `OllamaRequest` - Payload structure for generating completions
- `OllamaResponse` - Full response object from Ollama API (includes timing metrics)
- `OllamaOptions` - Optional parameters (temperature, top_p, top_k, etc.)

#### 3. **UI State Management (App.vue)**
- Uses Vue Composition API with `ref()` for reactive state
- **Message interface**: Extends with `id`, `role`, `text`, `model`, `timestamp`
- **State handling**:
  - `messages` - Array of chat messages
  - `loading` - Boolean for request state
  - `status` - Status message with type (error/success/info)
  - `selectedModel` - Currently selected LLM model
  - `models` - Array of available models

#### 4. **Security & Content Handling**
- **Markdown rendering**: Via `markdown-it` with `html: false` (disables raw HTML)
- **XSS protection**: All HTML rendered via `DOMPurify.sanitize()` with whitelist:
  - Tags: `hr`, `br`, `p`, `a`, `img`, `span`, `pre`, `code`, `kbd`
  - Attributes: `href`, `src`, `alt`, `title`, `class`, `target`
- **CSS**: Uses TailwindCSS class syntax for styling

#### 5. **Data Validation**
- URL validation utilities in `utils/data.ts`:
  - `isUrl(value)` - Validates URL format
  - `ifUrl(value)` - Returns URL object or null

### Configuration Details

#### Vite Config (vite.config.ts)
- **Aliases**: Path aliases for cleaner imports
  - `@` → `src/`
  - `@services` → `src/services/`
  - `@components` → `src/components/`
  - etc.
- **Dev server**: 
  - Port: 5173 (configurable via `APP_PORT` env var)
  - Host: `0.0.0.0` (accessible from any network)
  - File watching: Ignores `node_modules`, `.git`, `public`, `no-commit`
  - Allowed hosts configured for specific domains
- **Plugins**: Vue, TailwindCSS Vite plugin, Vue DevTools

#### Tailwind CSS v4
- CSS-first configuration: `@import 'tailwindcss';` in `style.css`
- No separate config files needed (handled by Vite plugin)
- Plugins: Forms (`@tailwindcss/forms`) and Typography (`@tailwindcss/typography`)

#### TypeScript (tsconfig.json & tsconfig.app.json)
- Strict mode enabled
- Module resolution for path aliases
- ES2020+ target

## Development Workflow

### Setting Up Local Development

1. **Install Ollama**: https://ollama.ai
2. **Pull a model**: `ollama pull mistral` (or other model)
3. **Start Ollama server** (in separate terminal): `ollama serve`
4. **Install dependencies**: `npm install`
5. **Start dev server**: `npm run dev`
6. **Access app**: Open http://localhost:5173

### Common Development Tasks

#### Adding a New Service Method
1. Define the interface in `src/types/ollama.ts`
2. Add method to `ollamaService` in `src/services/ollama.ts`
3. Use in `App.vue` with proper error handling

#### Modifying UI Components
- Single-file component (SFC) format with `<script setup lang="ts">`
- Use object syntax for conditional classes (per CLAUDE.md principles)
- Leverage TailwindCSS utilities for styling
- DOMPurify all user-generated HTML content

#### Styling Approach
- TailwindCSS v4 utilities (`bg-slate-900`, `text-white`, etc.)
- Dark theme classes: `dark:` prefix for dark mode support
- Responsive: `lg:`, `md:`, etc. for breakpoints
- Example: `class="bg-gradient-to-br from-slate-900 to-slate-800"` (gradients use `linear-to-` in v4)

## Debugging & Troubleshooting

### Ollama Connection Issues
- Verify Ollama is running: `ollama serve` in terminal
- Check base URL in localStorage or App.vue (default: `http://localhost:11434/api`)
- Ensure Ollama server is accessible (firewall, network config)

### Model Loading
- List available models: Check browser console after `loadModels()` call
- Download new model: `ollama pull <model-name>`
- Selected model must exist in Ollama's model list

### Performance
- First response may be slow (LLM loading into VRAM)
- Smaller models (`phi`, `neural-chat`) are faster
- Check Ollama response metrics in response object

## Key Files to Know

| File | Purpose | Key Patterns |
|------|---------|--------------|
| `src/App.vue` | Main UI and logic | Composition API, message state, markdown rendering |
| `src/services/ollama.ts` | Ollama API integration | Singleton service, error handling, localStorage |
| `src/types/ollama.ts` | Type definitions | Request/Response interfaces for Ollama |
| `vite.config.ts` | Build configuration | Path aliases, dev server config, plugins |
| `src/style.css` | Global styles | Tailwind v4 directives, plugin imports |

## Environment Variables (Optional)

Add to `.env` or `.env.local`:
```
APP_PORT=5173                                      # Dev server port
VITE_VUE_DEVTOOLS_LAUNCH_EDITOR=code              # Editor for Vue DevTools
VITE_VUE_DEVTOOLS_EDITOR_HOST=https://...         # Editor server host
```

## Important Notes

- **TailwindCSS v4**: Uses `@import 'tailwindcss'` and `bg-linear-*` instead of `bg-gradient-*`
- **localStorage**: Ollama base URL persists in browser storage
- **Security**: All markdown HTML is sanitized with DOMPurify before rendering
- **No streaming**: Currently uses non-streaming Ollama API (`stream: false`)
- **Responsive**: Chat interface is responsive but optimized for larger screens (600px height container)

## Future Enhancement Ideas

- Add response streaming support
- Persistent chat history (IndexedDB or backend)
- Export conversations to Markdown/PDF
- Multi-conversation support
- System prompt customization
- Token usage analytics
- Support for multiple Ollama instances

