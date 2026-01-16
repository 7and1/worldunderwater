# World Under Water

Automated climate disaster monitoring + survival product affiliate site.

## Stack

- **Frontend**: Next.js 15 (App Router) + React 19
- **CMS**: PayloadCMS 3.x
- **Database**: PostgreSQL with PostGIS
- **Deployment**: VPS (Docker) + Cloudflare Pages

## Quick Start

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build
npm run start
```

## Deployment

### Frontend (Cloudflare Pages)

Automatic deployment via GitHub Actions on push to `main` branch.

### Backend (VPS Docker)

```bash
# Full deployment (first time)
./deploy.sh --full

# Update code and rebuild
./deploy.sh --build

# View logs
./deploy.sh --logs

# Check status
./deploy.sh --status
```

## Environment Variables

Copy example files and configure:

```bash
cp .env.example .env
# Edit .env with your values
```

See `.env.example` for all available options.

## License

Proprietary - All rights reserved
