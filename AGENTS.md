# AGENTS.md

This file documents recommended agent workflows and automation patterns for the Ollama Local Chat UI project.

## Available Agent Types & Use Cases

### 1. **Front-End Agent** - UI Development & Styling
Use when: Adding UI components, modifying layouts, fixing styling issues

**Recommended for:**
- Creating new Vue components with proper structure
- Styling adjustments with TailwindCSS v4
- Responsive design improvements
- Dark mode refinements
- Component lifecycle management

**Example commands:**
```bash
# Enhance chat message display
/agent front-end-agent
Add support for code syntax highlighting in chat messages

# Responsive design fix
/agent front-end-agent
Fix chat container on mobile devices to be fully responsive

# Create new component
/agent front-end-agent
Extract message rendering into a separate MessageBubble component
```

### 2. **Code Simplifier** - Code Quality & Refactoring
Use when: Improving code clarity, reducing complexity, optimizing existing code

**Recommended for:**
- Refactoring App.vue logic into smaller composables
- Simplifying conditional rendering
- Extracting reusable utilities
- Improving type safety
- Code organization

**Example commands:**
```bash
# Extract logic into composables
/agent code-simplifier
Break App.vue into composable hooks (useChat, useModels, useStatus)

# Simplify markdown handling
/agent code-simplifier
Refactor markdown-it and DOMPurify integration into a composable

# Clean up state management
/agent code-simplifier
Consolidate message-related state variables into a single composable
```

### 3. **Explore Agent** - Codebase Research
Use when: Understanding how features are implemented, finding files, mapping patterns

**Recommended for:**
- Finding all places where Ollama API is called
- Understanding how markdown rendering works
- Mapping message state flow
- Locating error handling patterns
- Research before implementing new features

**Example commands:**
```bash
# Find Ollama usage
/agent Explore
Where is ollamaService used in the codebase? Show all calls.

# Markdown pipeline
/agent Explore --breadth medium
Trace the complete flow: user input → markdown render → DOMPurify sanitize

# Error handling patterns
/agent Explore --breadth quick
Which files have error handling? Show try-catch blocks and error messages.
```

### 4. **Back-End Agent** - Service & API Layer
Use when: Extending Ollama integration, adding new API methods, server communication

**Recommended for:**
- Adding new Ollama API methods (embeddings, summarization, etc.)
- Implementing streaming responses
- Adding retry logic and exponential backoff
- Caching layer for model list
- Request logging and monitoring

**Example commands:**
```bash
# Implement streaming
/agent back-end-agent
Add streaming support to ollamaService.ask() method

# Add embeddings API
/agent back-end-agent
Create new method ollamaService.getEmbeddings() for text embeddings

# Implement retry logic
/agent back-end-agent
Add exponential backoff retry logic to API calls
```

### 5. **React Clean Code** (or Vue equivalent) - Best Practices
Use when: Ensuring code follows Vue 3 + TypeScript best practices

**Recommended for:**
- Composition API patterns
- Component organization
- Reactive state management
- TypeScript strictness
- Performance optimization

**Example commands:**
```bash
# Audit Vue patterns
/agent vue-clean-code
Review App.vue for Vue 3 best practices and suggest improvements

# TypeScript strictness
/agent vue-clean-code
Ensure all variables and functions have proper type annotations
```

## Recommended Workflows

### Workflow 1: Adding Message Streaming Support

**Goal**: Stream responses instead of waiting for full response

**Agent Sequence**:
1. **Explore Agent** - Research streaming pattern in codebase
   ```bash
   /agent Explore
   How would we implement streaming Ollama responses?
   ```

2. **Back-End Agent** - Modify ollama.ts service
   ```bash
   /agent back-end-agent
   Add streaming support to ollamaService with EventSource or fetch streams
   ```

3. **Front-End Agent** - Update UI to handle streaming
   ```bash
   /agent front-end-agent
   Update App.vue to display streaming message in real-time
   ```

4. **Code Simplifier** - Extract streaming logic
   ```bash
   /agent code-simplifier
   Extract streaming message update logic into a composable
   ```

### Workflow 2: Persistent Chat History

**Goal**: Save conversations locally and restore them

**Agent Sequence**:
1. **Explore Agent** - Check current localStorage usage
   ```bash
   /agent Explore --breadth quick
   Where is localStorage used? What pattern should we follow?
   ```

2. **Back-End Agent** - Create storage service
   ```bash
   /agent back-end-agent
   Create src/services/storage.ts for chat history persistence
   ```

3. **Front-End Agent** - Integrate with UI
   ```bash
   /agent front-end-agent
   Add UI controls to save, load, and delete chat histories
   ```

### Workflow 3: Code Quality Audit & Refactor

**Goal**: Improve code organization and maintainability

**Agent Sequence**:
1. **Explore Agent** - Map current architecture
   ```bash
   /agent Explore --breadth medium
   Analyze the complete application structure and identify improvement areas
   ```

2. **Code Simplifier** - Refactor main component
   ```bash
   /agent code-simplifier
   Break App.vue into smaller, focused composables and components
   ```

3. **Vue Clean Code** - Ensure best practices
   ```bash
   /agent vue-clean-code
   Review refactored code for Vue 3 + TypeScript best practices
   ```

## Agent Coordination Patterns

### Sequential Agents (Do This)
For dependent tasks where output from one agent informs the next:

```
Research (Explore) → Design (Architect) → Implement (Front/Back-End) → Review (Clean-Code)
```

Example: Adding a new complex feature
1. Explore the existing patterns
2. Get architecture recommendations
3. Implement the feature
4. Review for code quality

### Parallel Agents (Use When Independent)
For truly independent tasks that don't block each other:

```
Agent 1: Add new UI component
Agent 2: Fix unrelated bug in service layer
(Both run simultaneously)
```

Use when: Tasks touch different file areas with no dependencies

## When NOT to Use Agents

### Use Direct Claude Code Instead
- Small, isolated bug fixes
- Simple CSS/styling tweaks
- Updating a single value or configuration
- Reading/understanding existing code (just ask directly)
- Minor documentation changes

### Example: Don't use agents for...
```bash
❌ /agent front-end-agent
   Change primary color from blue-600 to blue-700

✅ Just edit src/App.vue directly:
   Replace :class="'bg-blue-600'" with :class="'bg-blue-700'"
```

## Project-Specific Agent Tips

### For This Chat UI Project

1. **Always maintain DOMPurify sanitization** when modifying message rendering
2. **Test with real Ollama** - agents should verify against actual API
3. **Keep localStorage in mind** - base URL is persisted for server configuration
4. **TypeScript strict mode** - maintain type safety throughout
5. **TailwindCSS v4 syntax** - use `bg-linear-*` not `bg-gradient-*`
6. **Responsive design** - test with mobile and desktop layouts

### Pre-Agent Checklist
Before spawning an agent:
- [ ] Dev server can start: `npm run dev`
- [ ] Ollama is accessible: `http://localhost:11434`
- [ ] Latest dependencies: `npm install`
- [ ] No uncommitted breaking changes

## Useful Agent Prompting Patterns

### Request specific code style
```bash
/agent front-end-agent
Add component using Vue 3 Composition API with TypeScript.
Use object syntax for conditional classes (not ternary operators).
Follow the patterns established in App.vue.
```

### Request architecture review before implementation
```bash
/agent Explore
Map how messages flow from user input → Ollama call → display.
Identify where streaming could be added without refactoring.
```

### Request security audit
```bash
/agent back-end-agent
Review ollama.ts for security vulnerabilities.
Audit API request handling, error messages, and URL validation.
```

## Documenting Agent Work

After using an agent to make significant changes:

1. **Update CLAUDE.md** if architecture changes
2. **Add comments** for complex new logic
3. **Update README.md** if user-facing features changed
4. **Tag commits** with agent-assisted label if tracking

Example commit:
```
feat: streaming support for Ollama responses

- Implement EventSource streaming in ollamaService
- Update UI to render tokens as they arrive
- Extract streaming logic into useStreamingMessage composable

(agent-assisted: back-end-agent, front-end-agent)
```

## Emergency/Reset Procedures

### If Agent Introduces Breaking Changes
```bash
git diff                    # See what changed
git restore <file>          # Revert specific file
git checkout HEAD -- .      # Full revert of working tree
```

### If Dependencies Break
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## Resources & References

- **Claude Code Docs**: `/help` in Claude Code
- **Vue 3 Guide**: https://vuejs.org
- **Vite Docs**: https://vitejs.dev
- **Tailwind CSS v4**: https://tailwindcss.com
- **Ollama API**: https://github.com/jmorganca/ollama/blob/main/docs/api.md
- **TypeScript**: https://www.typescriptlang.org

