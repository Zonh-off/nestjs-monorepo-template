# 🏗️ Project Architecture

---

## Stack Summary

| Layer | Technology | Notes |
|---|---|---|
| Runtime framework | NestJS v11+ | Module-based, DI container |
| Database ORM | Prisma + PostgreSQL | Multi-file directory schemas (Prisma 7) |
| Caching | Redis v7+ | `@nestjs-monorepo-template/cache` shared wrapper |
| Queue Worker | BullMQ + Redis | Background job execution engine |
| Validation | Zod (strict) + `nestjs-zod` | No `class-validator`. Decoupled from common. |
| Auth | Better Auth | Social login only — Google & Discord |
| Admin UI | AdminJS + `@adminjs/prisma` | Mounted in `apps/admin/` |

---

## Monorepo Structure

```
nestjs-monorepo-template/
├── apps/
│   ├── backend/         # Public REST API — JWT-protected (NestJS)
│   ├── admin/           # Internal admin panel — session-protected (AdminJS)
│   └── web/             # Public frontend — Next.js (moved in later)
├── libs/
│   ├── cache/           # Shared Redis Cache module with type-safe wrap()
│   ├── common/          # Zod schemas, shared types, RBAC guards (pure TS)
│   ├── auth/            # Better Auth instance, session & JWT helpers
│   ├── prisma/          # PrismaService + Prisma generated client output
│   ├── queue/           # BullMQ task queues (mail, assets) and workers
│   └── utils/           # Pure functions only — date, env, string
├── prisma/
│   ├── base.prisma      # ← Generator client + datasource config (Prisma 7)
│   ├── user.prisma      # ← User database model
│   ├── session.prisma   # ← Session database model
│   ├── account.prisma   # ← OAuth third-party accounts mapping
│   ├── verification.prisma # ← Challenge tokens mapping
│   └── migrations/
└── project.md
```

> **Why are Prisma schemas in `/prisma` and split?**
> We leverage **Prisma 7's native multi-file directory schema** support. Models are split into separate `.prisma` files (e.g. `user.prisma`, `session.prisma`) under the `/prisma` folder, avoiding a single monolithic file. 
> Connection URLs are dynamically managed inside `prisma.config.ts`.
> The **generated client is output into `libs/prisma/`** via the `generator` block — so the lib is the semantic owner:
> ```prisma
> generator client {
>   provider = "prisma-client-js"
>   output   = "../libs/prisma/generated"
> }
> ```
> The schema folder is physically at the root for tooling convenience; `libs/prisma/` owns the runtime client.

---

## Applications

### `apps/backend/` — Public REST API

**Port:** `3000` | **Auth:** JWT Bearer | **Audience:** `apps/web/` + future mobile

The NestJS REST API organised around **feature modules**. Each feature owns its full vertical slice — routing, business logic, and local schemas — without leaking internals to other features.

---

#### Directory Structure

```
apps/backend/
├── src/
│   ├── main.ts                      # Bootstrap only
│   ├── app.module.ts                # Imports CoreModule + all feature modules
│   ├── core/                        # Cross-cutting, non-feature concerns
│   │   ├── core.module.ts           # Exports guards, filters, interceptors globally
│   │   ├── guards/
│   │   │   └── jwt.guard.ts         # Verifies Bearer token via libs/auth
│   │   ├── interceptors/
│   │   │   └── response.interceptor.ts  # Wraps all responses: { data, meta }
│   │   ├── filters/
│   │   │   └── exception.filter.ts  # Maps exceptions → consistent error shape
│   │   └── pipes/
│   │       └── zod-validation.pipe.ts   # Re-exports ZodValidationPipe (nestjs-zod)
│   └── features/                    # One folder per product domain
│       ├── auth/
│       ├── users/
│       └── ...
├── test/
└── package.json
```

---

#### Anatomy of a Feature Module

Every feature follows the exact same internal layout. No exceptions.

```
features/{feature}/
├── {feature}.module.ts        # NestJS module — declares, imports, exports
├── {feature}.controller.ts    # HTTP layer only — no business logic
├── {feature}.service.ts       # Business logic — uses PrismaService directly
└── schemas/
    └── {feature}.schema.ts    # Zod schemas local to this feature
```

**Rule:** If a file does not fit one of these four roles, question whether it belongs here or in `libs/`.

---

#### Anatomy Explained

**`{feature}.module.ts`**
```typescript
@Module({
  imports: [PrismaModule],        // always — provides PrismaService
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],        // only export if another feature needs it
})
export class UsersModule {}
```

**`{feature}.controller.ts`** — HTTP boundary only
```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);   // delegate immediately — no logic here
  }
}
```

**`{feature}.service.ts`** — all logic lives here
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}  // direct injection

  async findOne(id: string) {
    return this.prisma.user.findUniqueOrThrow({ where: { id } });
  }
}
```

**`schemas/{feature}.schema.ts`** — Zod schemas private to this feature
```typescript
export const CreateUserSchema = z.object({
  username: z.string().min(3).max(32),
  email:    z.string().email(),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
// ↑ this is what the controller receives — auto-validated by ZodValidationPipe
```

---

#### Schema Placement Rules

| Schema type | Where it lives | Reason |
|---|---|---|
| Request body for one feature | `features/{feature}/schemas/` | Private to that feature |
| Response shape used by multiple features | `libs/common/schemas/` | Single source of truth (Zod) |
| Shared entity type (e.g. `UserSchema`) | `libs/common/schemas/` | Frontend contract (pure Zod) |
| NestJS validation DTO (e.g. `UserDto`) | `features/{feature}/schemas/` or `apps/backend/` | Kept on the server to prevent bundler errors on the client |
| Env / config validation | `libs/common/schemas/env.schema.ts` | App-wide schema (e.g., database & redis ports) |

---

#### `core/` Module — Global Concerns

`CoreModule` registers everything globally so no feature module needs to repeat it.

```typescript
// core.module.ts
@Global()
@Module({
  providers: [
    { provide: APP_GUARD,       useClass: JwtGuard },         // auth on all routes
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER,      useClass: ExceptionFilter },
  ],
})
export class CoreModule {}
```

To make a route **public** (no JWT required), use a decorator:
```typescript
// core/decorators/public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);

// usage in controller
@Public()
@Get('/health')
health() { return { ok: true }; }
```
`JwtGuard` checks the `isPublic` metadata and skips verification.

---

#### `main.ts` — Bootstrap

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe());   // from nestjs-zod
  app.enableCors({ origin: process.env.WEB_URL });
  app.use(helmet());

  await app.listen(3000);
}
```

> `APP_GUARD`, `APP_INTERCEPTOR`, `APP_FILTER` are registered via `CoreModule`, not here.
> `main.ts` stays thin — bootstrap only, no business wiring.

---

#### Inter-Feature Dependencies

Features communicate through **module imports**, never through direct file imports.

```
✅  UsersModule exports UsersService
    GamesModule imports UsersModule → injects UsersService

❌  game.service.ts imports from '../../users/users.service'
```

If two features need to share data, the providing feature must explicitly `export` its service. If the dependency is circular, it's a signal to extract shared logic to `libs/common/`.

---

#### Naming Conventions

| File | Convention | Example |
|---|---|---|
| Module | `{feature}.module.ts` | `users.module.ts` |
| Controller | `{feature}.controller.ts` | `users.controller.ts` |
| Service | `{feature}.service.ts` | `users.service.ts` |
| Schemas | `{feature}.schema.ts` | `users.schema.ts` |
| Guard | `{name}.guard.ts` | `jwt.guard.ts` |
| Decorator | `{name}.decorator.ts` | `current-user.decorator.ts` |
| Enum folder | `features/{feature}/` | no separate enum files — put in schema |

Route paths are `kebab-case`, plural nouns: `/users`, `/game-sessions`, `/auth/callback`.

---

#### Auth model

JWT Bearer tokens. Better Auth issues them after social login; every subsequent request carries the token in `Authorization: Bearer <token>`. `JwtGuard` (in `core/`) resolves the user and attaches it to the request — features access it via `@CurrentUser()` decorator from `libs/auth/`.

**What it does NOT do:**
- No admin operations (no elevated mutations)
- No session cookies
- No serving HTML

---

### `apps/admin/` — Internal Admin Panel

**Port:** `3001` | **Auth:** Session cookie | **Audience:** Internal staff only

A dedicated NestJS application that mounts AdminJS as its UI. It is not a REST API — AdminJS owns all routes and renders the interface server-side.

**Responsibilities:**
- Full CRUD over all Prisma models via `@adminjs/prisma` adapter
- Staff authentication through Better Auth (social login, same providers)
- Custom AdminJS actions for operational tasks (bans, resets, manual overrides)
- Audit visibility — who changed what and when (use Prisma `updatedAt`/`createdBy`)

**Internal structure:**
```
admin/src/
├── main.ts                 # Bootstrap, mounts AdminJS on NestJS HTTP adapter
├── app.module.ts
└── adminjs/
    ├── adminjs.setup.ts    # AdminJS instance config, resource registration
    ├── auth.setup.ts       # Better Auth session strategy for AdminJS
    └── resources/          # Per-model resource configs (fields, actions, display)
```

**Auth model:** Session cookies via Better Auth. AdminJS's built-in `authenticate` hook calls `libs/auth/` to verify the session. Completely separate session store from `apps/backend/`.

**Key decisions:**
- Deployed separately — restrict access by IP allowlist or VPN at the infra level
- Does not import from `libs/common/` Guards (different auth surface entirely)
- `PrismaService` from `libs/prisma/` is used directly by `@adminjs/prisma` adapter
- No Swagger, no `ZodValidationPipe` — AdminJS manages its own form validation

**What it does NOT do:**
- No public-facing routes
- No JWT
- No REST API endpoints

---

### `apps/web/` — Public Frontend

**Port:** `4000` (dev) | **Auth:** JWT in httpOnly cookie or memory | **Audience:** End users

The Next.js frontend. Exists as a standalone project and will be moved into the monorepo. Until then it is treated as a first-class consumer of `apps/backend/`.

**Responsibilities:**
- All user-facing UI (game browser, profiles, matchmaking, etc.)
- Initiates OAuth flow → redirects to `apps/backend/` auth endpoint
- Stores JWT returned by backend, attaches to every API request
- Server-Side Rendering (SSR) for SEO-sensitive pages
- Static generation where data is not user-specific

**Internal structure (Next.js App Router):**
```
web/
├── app/                    # App Router — layouts, pages, loading states
│   ├── (public)/           # Unauthenticated routes
│   ├── (auth)/             # Protected routes (middleware guard)
│   └── api/                # Route handlers if needed (thin proxies only)
├── components/             # UI components
├── lib/
│   ├── api.ts              # Typed fetch wrapper for backend REST calls
│   └── auth.ts             # JWT storage, refresh logic, auth context
└── middleware.ts            # Next.js middleware — redirect unauthenticated users
```

**Auth model:** After OAuth, backend issues a JWT. Web stores it in an `httpOnly` cookie (recommended) or in-memory. Passed as `Authorization: Bearer` on every backend API call.

**Key decisions:**
- Does NOT share `libs/` directly until moved into the monorepo
- API calls go exclusively to `apps/backend/` — no direct DB access
- `lib/api.ts` is the single typed API client (no scattered `fetch` calls)
- Zod used on the frontend for form validation (independently — same schema definitions can be duplicated or shared via `libs/common/` post-monorepo-merge)

**What it does NOT do:**
- No admin operations
- No direct database access
- No AdminJS

---

## Shared Libraries

### `libs/prisma/` — Database Access

Hosts `PrismaService` and the Prisma-generated client. This is what every app imports.

```typescript
// Pattern used everywhere — no repository wrappers, no abstract classes
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() { await this.$connect(); }
}
```

**What lives here:**
- `PrismaService` — the single injectable DB client (utilizing pg connection pools and pg-adapters for Prisma 7)
- `generated/` — Prisma client types, output here by `prisma generate`

**What does NOT live here:**
- Split schemas — physically at repo root `/prisma/` for CLI ergonomics, but semantically owned by this lib
- Migration files — also at `/prisma/migrations/` for the same reason

**Rules:**
- `PrismaService` is injected **directly** into NestJS service classes — no repository wrappers
- Apps never import from `@prisma/client` directly — always through this lib
- Run migrations from repo root: `npx prisma migrate dev`

---

### `libs/cache/` — Global Caching Layer

Hosts `@nestjs-monorepo-template/cache` providing global Redis caching capabilities.

**Contains:**
- `CacheService` — exposing high-level, type-safe API queries: `get<T>`, `set<T>`, `del`, and the high-order **`wrap<T>(key, fallback, ttl)`** query cacher.
- Fully asynchronous Redis provider registration using process environment config.

---

### `libs/queue/` — BullMQ Task Queues & Workers

Hosts `@nestjs-monorepo-template/queue` providing background queue processing using BullMQ.

**Contains:**
- **Feature Domain Queues**: Organized by features (`mail` and `asset`).
- `MailQueueService` & `MailQueueProcessor`: Asynchronous sending of CTA welcome, password reset, and verification emails using responsive design layouts.
- `AssetQueueService` & `AssetQueueProcessor`: Profile avatar image resizing, compression, and file operations.

---

### `libs/common/` — Shared Contracts

All Zod schemas, inferred TypeScript types, and NestJS primitives that both apps share.

**Contains:**
- **Zod schemas** — request/response validation, env validation
- **Guards** — role-based access control (RBAC), shared between apps
- **Interceptors** — standard response envelope, error serialization
- **Constants & enums** — shared application-wide values

**Rules:**
- Zero `class-validator` / `@IsString()` / `@IsEmail()` decorators — use Zod
- **Decoupled Boundary**: Zero server-only `nestjs-zod` or NestJS runtime decorators are imported inside `@nestjs-monorepo-template/common`. This allows the frontend (Vite/Next.js) to import shared Zod contracts without bundling server decorators.
- All server DTOs are mapped inside backend apps using `createZodDto(...)` locally.

---

### `libs/auth/` — Authentication Boundary

Isolates all Better Auth concerns from the rest of the codebase.

**Contains:**
- Better Auth instance configuration (Google & Discord providers)
- `AuthService` — session resolution, JWT extraction helpers
- NestJS guard base for verifying auth state in both apps
- Shared user identity type (`AuthUser`) used in request context

**Why a dedicated lib?** Both `apps/client/` (JWT) and `apps/admin/` (session) need auth, but through different mechanisms. This lib provides unified resolution while keeping the two flows distinct.

---

### `libs/utils/` — Pure Functions

Zero-dependency utility functions with no side effects.

**Contains:**
- Date formatting (Day.js)
- Cryptography helpers (`crypto` module)
- String/slug utilities
- Environment variable parsing with Zod (`z.object({ ... }).parse(process.env)`)

**Rule:** If a function has a side effect or needs injection — it does not belong here.

---

## Validation Strategy

> **Rule:** Zod is the single validation layer. No exceptions.

```
HTTP Request
    │
    ▼
ZodValidationPipe (global, from nestjs-zod)
    │  parses req.body against createZodDto(schema)
    ▼
Controller (receives typed, validated payload)
    │
    ▼
Service (operates on validated data — no re-validation needed)
```

**Benefits of this approach:**
- Zod schemas in `libs/common/` serve as both validation AND TypeScript types
- One schema = pipe validation + Swagger doc + inferred DTO type
- Errors are normalized to consistent format by `nestjs-zod`

---

## Authentication Flow

```
User → OAuth (Google / Discord)
    │
    ▼
Better Auth (in libs/auth/)
    │
    ├─ apps/client/: issues JWT access token → client stores in memory/cookie
    └─ apps/admin/:  issues session cookie   → browser session
    
JWT Guard (apps/client/)         Session Guard (apps/admin/)
    │                                │
    ▼                                ▼
AuthUser injected into             AdminJS user resolved
request context                    from session
```

---

## Cross-App Communication

**Applications interact using asynchronous message processing and database sharing.**

Both apps share state through:
- **PostgreSQL** — single DB, both apps use `PrismaService` from `libs/prisma/`
- **Better Auth session store** — shared auth state
- **Redis & BullMQ** — background queue processors and jobs routing

---

## Deployment Topology

```
┌─────────────────────────────┐
│  apps/client/               │  ← Public internet
│  Port: 3000                 │
│  Auth: JWT Bearer            │
└─────────────────────────────┘

┌─────────────────────────────┐
│  apps/admin/                │  ← Internal / VPN only
│  Port: 3001                 │
│  Auth: Session cookie        │
└─────────────────────────────┘

┌─────────────────────────────┐
│  PostgreSQL                 │  ← Private network
│  Shared by both apps         │
└─────────────────────────────┘
```

Each app is deployed independently. `libs/` are compiled and bundled with each app at build time — they are not separate running services.

---

## Architectural Decisions (ADRs)

| # | Decision | Rationale |
|---|---|---|
| ADR-01 | `nestjs-zod` as Zod-NestJS bridge | Eliminates hand-rolled pipe; gives `createZodDto()`, auto-Swagger, and `ZodValidationPipe` |
| ADR-02 | Separate `apps/admin/` process | AdminJS needs session auth; client uses JWT — different security surfaces |
| ADR-03 | `PrismaService` injected directly | Prisma's type-safe API is already a sufficient abstraction; repository wrappers add boilerplate without benefit at this stage |
| ADR-04 | `libs/auth/` as explicit boundary | Better Auth config is consumed by both apps through different flows; isolation prevents duplication |
| ADR-05 | Social login only (Google + Discord) | Eliminates password storage, reset flows, and brute-force vectors entirely |
| ADR-06 | No CQRS / Event Sourcing | Premature for current scope; can be introduced per-feature if needed later |
| ADR-07 | Single `schema.prisma` | One migration stream, one DB, consistent models — no per-app schemas |

---

## What This Architecture Explicitly Avoids

| Omitted Pattern | Reason |
|---|---|
| `class-validator` / `class-transformer` | Replaced entirely by Zod |
| Repository / Unit of Work classes | Over-engineering over Prisma's existing type-safe API |
| CQRS / Event Sourcing | Premature complexity — survivorship bias from over-architected systems |
| Heavy Messaging Servers (RabbitMQ / Kafka) | We use lightweight Redis + BullMQ background worker engine instead |
| Microservices split | Monorepo with two apps is the right scale for now |