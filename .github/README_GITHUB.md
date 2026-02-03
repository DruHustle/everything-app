# Everything App - GitHub Repository Setup

This file documents the GitHub repository setup and deployment configuration.

## Repository Information

- **Repository Name:** everything-app
- **Owner:** DruHustle
- **Email:** andrewgotora@yahoo.com
- **Visibility:** Public
- **License:** MIT

## Quick Start

### Clone the Repository

```bash
git clone https://github.com/DruHustle/everything-app.git
cd everything-app
```

### Install Dependencies

```bash
pnpm install
```

### Set Up Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

### Run Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Vercel will automatically deploy on push to `main` branch

**Vercel URL:** https://everything-app.vercel.app

### Render Deployment

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Add environment variables in Render dashboard
4. Render will automatically deploy on push to `main` branch

**Render URL:** https://everything-app.onrender.com

### Database Setup

The application uses Aiven DB for database hosting:

1. Create an Aiven account at https://aiven.io
2. Create a MySQL database service
3. Get the connection string and add it to environment variables as `DATABASE_URL`

For detailed setup instructions, see [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md)

## CI/CD Pipeline

GitHub Actions automatically:

- Runs tests on every push
- Builds the project
- Deploys to Vercel and Render on successful build (main branch only)

### Required GitHub Secrets

For automatic deployment, add these secrets to your repository:

**Vercel:**
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

**Render:**
- `RENDER_SERVICE_ID`
- `RENDER_API_KEY`

## Project Structure

```
everything-app/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   ├── contexts/   # React contexts
│   │   └── lib/        # Utilities and helpers
│   └── public/         # Static assets
├── server/             # Express backend
│   ├── routers.ts      # tRPC routers
│   ├── db.ts           # Database helpers
│   └── _core/          # Core server infrastructure
├── drizzle/            # Database schema and migrations
├── shared/             # Shared types and constants
├── docs/               # Documentation
└── .github/            # GitHub Actions workflows
```

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am "Add your feature"`
3. Push to GitHub: `git push origin feature/your-feature`
4. Create a Pull Request on GitHub
5. GitHub Actions will run tests automatically
6. After approval, merge to `main` branch
7. Automatic deployment to Vercel and Render

## Testing

Run tests locally:

```bash
pnpm test
```

Run type checking:

```bash
pnpm check
```

Run linter:

```bash
pnpm format --check
```

## Documentation

- [README.md](../README.md) - Project overview
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture
- [docs/DATABASE.md](../docs/DATABASE.md) - Database schema
- [docs/API.md](../docs/API.md) - API documentation
- [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) - Deployment guide

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues or questions:

1. Check existing GitHub Issues
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## License

MIT License - See LICENSE file for details

## Contact

- **Email:** andrewgotora@yahoo.com
- **GitHub:** @DruHustle
