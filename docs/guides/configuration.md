# Configuration

All available options when generating a project.

## Core Options

| Option | Values | Description |
|--------|--------|-------------|
| `--database` | `postgresql`, `mongodb`, `sqlite`, `none` | Database backend (async by default) |
| `--orm` | `sqlalchemy`, `sqlmodel` | ORM choice (SQLModel for simplified syntax) |
| `--auth` | `jwt`, `api_key`, `both`, `none` | Authentication method |
| `--oauth` | `none`, `google` | OAuth2 social login |
| `--ai-framework` | `pydantic_ai`, `langchain` | AI agent framework |
| `--llm-provider` | `openai`, `anthropic`, `openrouter` | LLM provider |
| `--background-tasks` | `none`, `celery`, `taskiq`, `arq` | Background task queue |
| `--frontend` | `none`, `nextjs` | Frontend framework |

## Presets

```bash
# Full production setup
fastapi-fullstack create my_app --preset production

# AI agent with streaming
fastapi-fullstack create my_app --preset ai-agent

# Minimal project
fastapi-fullstack create my_app --minimal
```

## AI Framework Options

### PydanticAI

```bash
fastapi-fullstack create my_app \
  --ai-agent \
  --ai-framework pydantic_ai \
  --llm-provider openai
```

Supported providers: `openai`, `anthropic`, `openrouter`

### LangChain

```bash
fastapi-fullstack create my_app \
  --ai-agent \
  --ai-framework langchain \
  --llm-provider anthropic
```

Supported providers: `openai`, `anthropic`

## Database Options

### PostgreSQL (recommended)

```bash
fastapi-fullstack create my_app --database postgresql
```

- Async via `asyncpg`
- Connection pooling
- Full SQL features

### MongoDB

```bash
fastapi-fullstack create my_app --database mongodb
```

- Async via `Motor`
- Beanie ODM
- Flexible schema

## Integrations

Enable during project generation:

```bash
fastapi-fullstack new
# ✓ Redis (caching/sessions)
# ✓ Rate limiting (slowapi)
# ✓ Pagination
# ✓ Admin Panel (SQLAdmin)
# ✓ Webhooks
# ✓ Sentry
# ✓ Logfire / LangSmith
# ✓ Prometheus
```

## Environment Variables

Generated projects use `.env` files:

```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db

# Auth
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256

# AI
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Observability
LOGFIRE_TOKEN=...
SENTRY_DSN=...
```

## Next Steps

- [Quick Start](quick-start.md) - Run your project
- [AI Agents](../ai-agent.md) - Configure AI frameworks
- [Deployment](../deployment.md) - Deploy to production
