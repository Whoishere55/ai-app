# AI Chat App

A full-stack AI chat web application built with Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma, and OpenAI. Supports multi-thread conversations, a plugin/tool system, and ChatGPT conversation import.

---

## Features

- 💬 **Multi-thread chat** — Create and manage multiple conversation threads
- 🤖 **OpenAI-compatible backend** — Uses the OpenAI SDK; swap in any compatible endpoint via `OPENAI_BASE_URL`
- 🔧 **Plugin/Tool system** — `ToolRegistry` pattern with built-in Summarize and Extract Action Items tools
- 📥 **ChatGPT import** — Upload your ChatGPT export ZIP, preview the most recent conversation, then import it
- 🗄️ **Postgres persistence** — Thread and Message models via Prisma ORM
- 🚀 **Vercel-ready** — `vercel.json` with Prisma generate step included

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Prisma ORM |
| AI | OpenAI SDK (any OpenAI-compatible API) |
| ZIP parsing | adm-zip |
| Testing | Jest + ts-jest |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Docker)

### 1. Clone & Install

```bash
git clone <repo-url>
cd ai-app
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://aiapp:aiapp@localhost:5432/aiapp"
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"   # optional, defaults to OpenAI
OPENAI_MODEL="gpt-4o-mini"                     # optional, defaults to gpt-4o-mini
```

### 3. Start Postgres (Docker)

```bash
docker-compose up -d
```

Or use any existing Postgres instance and update `DATABASE_URL`.

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `OPENAI_API_KEY` | ✅ | API key for OpenAI (or compatible service) |
| `OPENAI_BASE_URL` | ❌ | Base URL for the AI API (default: `https://api.openai.com/v1`) |
| `OPENAI_MODEL` | ❌ | Model to use (default: `gpt-4o-mini`) |

---

## Project Structure

```
ai-app/
├── app/
│   ├── api/
│   │   ├── threads/
│   │   │   ├── route.ts              # GET /api/threads, POST /api/threads
│   │   │   └── [id]/
│   │   │       ├── messages/route.ts # GET/POST messages in a thread
│   │   │       └── tools/route.ts    # GET list tools, POST run a tool
│   │   └── import/route.ts           # POST ChatGPT ZIP import
│   ├── import/page.tsx               # Import UI page
│   ├── page.tsx                      # Main chat page
│   └── layout.tsx
├── components/
│   ├── ChatLayout.tsx                # Root layout with sidebar + panel
│   ├── ChatPanel.tsx                 # Message list + input box
│   ├── ImportPage.tsx                # ChatGPT import wizard
│   ├── ThreadList.tsx                # Sidebar thread list
│   └── ToolBar.tsx                   # Tool buttons in chat header
├── lib/
│   ├── chatgpt-importer.ts           # ZIP parsing + conversation extraction
│   ├── openai.ts                     # Singleton OpenAI client
│   ├── prisma.ts                     # Singleton Prisma client
│   └── tools/
│       ├── registry.ts               # ToolRegistry class + singleton
│       ├── index.ts                  # Register all tools
│       ├── summarize.ts              # Summarize tool
│       └── extractActionItems.ts     # Extract action items tool
├── prisma/
│   └── schema.prisma                 # Thread + Message models
├── __tests__/
│   ├── chatgpt-importer.test.ts
│   └── registry.test.ts
├── docker-compose.yml
├── vercel.json
└── .env.example
```

---

## API Reference

### Threads

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/threads` | List all threads (ordered by updatedAt desc) |
| POST | `/api/threads` | Create a new thread `{ title?: string }` |

### Messages

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/threads/:id/messages` | Get all messages in a thread |
| POST | `/api/threads/:id/messages` | Send a message `{ content: string }` — triggers LLM response |

### Tools

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/threads/:id/tools` | List available tools |
| POST | `/api/threads/:id/tools` | Run a tool `{ toolName: string }` |

### Import

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/import` | Upload ChatGPT ZIP. Form fields: `file` (ZIP), `dryRun` ("true"/"false") |

#### Import flow

1. Upload ZIP with `dryRun=true` → returns preview of most recent conversation
2. Upload ZIP with `dryRun=false` → imports conversation into DB, returns `{ threadId, title, messageCount }`

---

## Tool System

Tools are registered via the `ToolRegistry` pattern and can be invoked per-thread.

### Built-in Tools

| Tool name | Description |
|-----------|-------------|
| `summarize` | Summarize the current conversation |
| `extractActionItems` | Extract action items and tasks from the conversation |

### Adding a Custom Tool

```typescript
// lib/tools/myTool.ts
import { Tool } from './registry'

export const myTool: Tool = {
  name: 'myTool',
  description: 'Does something useful',
  handler: async (ctx) => {
    // ctx.threadId — the current thread ID
    // ctx.messages — array of { role, content }
    return { toolName: 'myTool', result: 'Hello from myTool!' }
  },
}
```

Register it in `lib/tools/index.ts`:

```typescript
import { myTool } from './myTool'
toolRegistry.register(myTool)
```

---

## ChatGPT Import

1. Go to `/import` in the app
2. Export your data from ChatGPT: Settings → Data Controls → Export Data
3. Upload the downloaded ZIP
4. Click **Preview Import** — shows the most recent conversation title, message count, and first 3 messages
5. Click **Confirm Import** — saves the conversation as a new thread tagged with `source: "chatgpt_import"`

**Security:** Files are validated as `.zip`, capped at 10 MB, and must contain `conversations.json`.

---

## Deployment (Vercel)

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings:
   - `DATABASE_URL` (use Vercel Postgres, Supabase, Neon, etc.)
   - `OPENAI_API_KEY`
   - `OPENAI_BASE_URL` (optional)
   - `OPENAI_MODEL` (optional)
4. The `vercel.json` `buildCommand` runs `prisma generate && next build` automatically

---

## Running Tests

```bash
npm test
```

Tests cover:
- `ToolRegistry` — register, list, run, error handling
- `chatgpt-importer` — ZIP parsing, message extraction, preview building, edge cases

---

## Local Database Reset

```bash
npx prisma migrate reset
```

---

## License

MIT
