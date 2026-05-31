# 🏗️ NestJS Monorepo

Welcome to the NestJS monorepo! This project is a full-stack, state-of-the-art monorepo featuring a modular NestJS API backend, an Refine-powered internal admin dashboard, a type-safe shared Redis caching layer, and a robust BullMQ background queuing engine.

> [!IMPORTANT]
> **Before writing any code or making edits, please thoroughly read [architecture.md](./architecture.md)** to understand the directory layout, clean boundary DTO schemas, and core architectural specifications!

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v20+ recommended)
- [pnpm](https://pnpm.io/) (`npm install -g pnpm`)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 2. Installation
Install all dependencies from the root directory:
```bash
pnpm install
```

### 3. Environment Setup
Copy the example environment configuration to create your local `.env` file:

On macOS/Linux:
```bash
cp .env.example .env
```

On Windows (Command Prompt / PowerShell):
```cmd
copy .env.example .env
```

Or manually copy the following template into a new `.env` file in the root directory:

```env
# Project Configuration
COMPOSE_PROJECT_NAME="nestjs-monorepo-template"

# Database
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="postgres"
POSTGRES_DB="${COMPOSE_PROJECT_NAME}"
POSTGRES_PORT=5433

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# URLs
API_URL="http://localhost:4001"
ADMIN_URL="http://localhost:3002"
WEB_URL="http://localhost:4000"

# Social Auth (Optional for local dev)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
DISCORD_CLIENT_ID=""
DISCORD_CLIENT_SECRET=""

# Storage Configuration
STORAGE_PROVIDER="local" # 'local' or 's3'
STORAGE_S3_BUCKET="my-bucket-name"
STORAGE_S3_REGION="us-east-1"
STORAGE_S3_ACCESS_KEY_ID=""
STORAGE_S3_SECRET_ACCESS_KEY=""
STORAGE_S3_ENDPOINT="" # Leave empty for AWS S3, or set for custom S3 like Cloudflare R2 / MinIO
```

### 4. Database Setup
Spin up the PostgreSQL database and Redis server using Docker:
```bash
docker compose up -d
```
*Note: The database runs on port **5433** and Redis on **6379** to avoid collisions with local instances.*

Synchronize the database schema and generate the Prisma client:
```bash
npx prisma db push
npx prisma generate
```

### 5. Seed Admin User
Generate a default admin user to access the dashboard:
```bash
pnpm run seed:admin
```
**Default Credentials:**
- **Email:** `admin@test.com`
- **Password:** `password123`

### 6. Development Mode
Start all applications in development mode:
```bash
pnpm run dev
```

---

## 🏗️ Project Structure

| Path | Description | URL / Type |
| :--- | :--- | :--- |
| `apps/backend` | NestJS API with Better Auth & global pipes | `http://localhost:4001` |
| `apps/admin` | AdminJS Panel for CRUD operations & management | `http://localhost:3002` |
| `libs/prisma` | Database Client Service with Connection Pooling | DB Access Layer |
| `libs/cache` | Shared Redis Type-safe Caching wrapper | Caching Layer |
| `libs/queue` | BullMQ background tasks & workers (Mail, Assets) | Job Queue Layer |
| `libs/auth` | Shareable Better Auth configuration & JWT guards | Security Layer |
| `libs/common` | Platform-agnostic shared Zod schemas & enums | TS / Schema contracts |
| `libs/utils` | Pure utility functions and string/date formatting | Utilities |
| `prisma/` | Split schema directories (`base`, `user`, `session`, etc.) | Prisma 7 Schemas |

---

## 🛠️ Key Commands

- `pnpm run dev`: Starts all apps via Turbo in development mode.
- `pnpm run build`: Compiles all monorepo packages (Full Turbo enabled).
- `pnpm run seed:admin`: Generates the default admin user.
- `npx prisma studio`: Opens the interactive Prisma database interface.
- `npx prisma db push`: Synchronizes your local database schema with the latest split models.
- `npx prisma generate`: Recompiles the Prisma Client based on split schema directory files.

## 🏷️ Renaming the Project Scope

If you want to rename the project scope and container namespaces from `nestjs-monorepo-template` to your own project name (e.g., `my-awesome-app`), run the following command in the root directory:

```bash
node scripts/rename.js <your-new-project-name>
```

This script recursively updates all package scopes (`@nestjs-monorepo-template` -> `@your-new-project-name`), import declarations, and Docker configuration parameters. 

After running the script, rebuild the package lockfile:

```bash
pnpm install
```

## 📝 Auth Notes
The project uses **Better Auth**. For social login (Google/Discord) to work, you must provide valid Client IDs and Secrets in your `.env` files. Manual email/password login is enabled by default for the Admin Panel. 