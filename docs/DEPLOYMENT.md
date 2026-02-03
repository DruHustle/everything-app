# Deployment Guide

This document provides step-by-step instructions for deploying the Everything App to production using Vercel, Render, and Aiven DB.

## Architecture Overview

The application uses a modern full-stack architecture:

- **Frontend:** React 19 with Vite, deployed on Vercel or Render
- **Backend:** Express.js with tRPC, deployed on Vercel or Render
- **Database:** MySQL/TiDB on Aiven DB
- **CI/CD:** GitHub Actions for automated testing and deployment

## Prerequisites

Before deploying, ensure you have:

1. **GitHub Account** - Repository hosting
2. **Vercel Account** - Frontend/Full-stack deployment (optional)
3. **Render Account** - Backend deployment (optional)
4. **Aiven Account** - Managed database hosting
5. **GitHub Secrets** - For storing sensitive credentials

## Step 1: Set Up Aiven DB

### Create Aiven Account

1. Go to [Aiven.io](https://aiven.io)
2. Sign up for a free account
3. Create a new project

### Create MySQL Database

1. In Aiven console, click "Create Service"
2. Select **MySQL** as the database type
3. Choose your region (e.g., US-East)
4. Select **Startup** plan (free tier)
5. Name the service: `everything-app-db`
6. Click "Create Service"

### Get Connection String

Once the database is ready:

1. Go to the service details
2. Find the **Connection Information** section
3. Copy the **Connection String** (looks like: `mysql://user:password@host:port/dbname`)
4. Save this for later use in environment variables

### Create Database and User

```sql
CREATE DATABASE everything_app;
CREATE USER 'everything_app_user'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON everything_app.* TO 'everything_app_user'@'%';
FLUSH PRIVILEGES;
```

## Step 2: Deploy to Vercel

### Connect GitHub Repository

1. Go to [Vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Connect your GitHub account
5. Select the `everything-app` repository
6. Click "Import"

### Configure Environment Variables

In Vercel project settings, add the following environment variables:

```
DATABASE_URL=mysql://user:password@host:port/dbname
JWT_SECRET=your_jwt_secret_here
NODE_ENV=production
VITE_APP_ID=your_app_id
OAUTH_SERVER_URL=your_oauth_url
VITE_OAUTH_PORTAL_URL=your_oauth_portal_url
OWNER_OPEN_ID=your_owner_id
OWNER_NAME=Your Name
BUILT_IN_FORGE_API_URL=api_url
BUILT_IN_FORGE_API_KEY=api_key
VITE_FRONTEND_FORGE_API_URL=frontend_api_url
VITE_FRONTEND_FORGE_API_KEY=frontend_api_key
```

### Deploy

1. Click "Deploy"
2. Vercel will automatically build and deploy your application
3. Your app will be available at `https://your-project.vercel.app`

## Step 3: Deploy to Render

### Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up and create a new account
3. Connect your GitHub account

### Create Web Service

1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name:** everything-app
   - **Environment:** Node
   - **Build Command:** `pnpm install && pnpm build`
   - **Start Command:** `pnpm start`

### Add Environment Variables

In the "Environment" section, add all the same environment variables as Vercel.

### Deploy

1. Click "Create Web Service"
2. Render will automatically deploy your application
3. Your app will be available at `https://everything-app.onrender.com`

## Step 4: Configure GitHub Actions

### Add Secrets to GitHub

Go to your repository settings and add the following secrets:

**For Vercel:**
- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

**For Render:**
- `RENDER_SERVICE_ID` - Your Render service ID
- `RENDER_API_KEY` - Your Render API key

### GitHub Actions Workflow

The `.github/workflows/test-and-build.yml` file automatically:

1. Runs tests on every push to `main` or `develop`
2. Builds the project
3. Deploys to Vercel on successful build (main branch only)
4. Deploys to Render on successful build (main branch only)

## Step 5: Database Migrations

After deployment, run database migrations:

```bash
# For Vercel (via SSH or local)
DATABASE_URL=your_aiven_url pnpm db:push

# For Render (via Render shell)
pnpm db:push
```

## Monitoring and Maintenance

### Vercel Monitoring

1. Go to Vercel dashboard
2. Select your project
3. View logs, analytics, and deployment history

### Render Monitoring

1. Go to Render dashboard
2. Select your service
3. View logs and metrics

### Aiven Monitoring

1. Go to Aiven console
2. Select your database service
3. Monitor CPU, memory, and connection usage

## Troubleshooting

### Database Connection Issues

- Verify the connection string is correct
- Check that your IP is whitelisted in Aiven (if using IP restrictions)
- Ensure the database user has proper permissions

### Build Failures

- Check GitHub Actions logs for error messages
- Verify all environment variables are set correctly
- Ensure `pnpm` dependencies are properly installed

### Deployment Failures

- Check Vercel/Render logs for specific errors
- Verify environment variables are set in the platform
- Ensure the build command completes successfully

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Aiven MySQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `NODE_ENV` | Environment (production/development) | Yes |
| `VITE_APP_ID` | OAuth application ID | Yes |
| `OAUTH_SERVER_URL` | OAuth server URL | Yes |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | Yes |
| `OWNER_OPEN_ID` | Owner's OpenID | Yes |
| `OWNER_NAME` | Owner's name | Yes |
| `BUILT_IN_FORGE_API_URL` | Built-in API URL | Yes |
| `BUILT_IN_FORGE_API_KEY` | Built-in API key | Yes |
| `VITE_FRONTEND_FORGE_API_URL` | Frontend API URL | Yes |
| `VITE_FRONTEND_FORGE_API_KEY` | Frontend API key | Yes |

## Scaling Considerations

### Database Scaling

- Monitor Aiven database metrics
- Upgrade plan if approaching resource limits
- Consider read replicas for high-traffic scenarios

### Application Scaling

- Vercel automatically scales serverless functions
- Render scales based on resource allocation
- Monitor response times and error rates

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate JWT secrets** - Periodically update `JWT_SECRET`
3. **Use strong database passwords** - Generate complex passwords
4. **Enable SSL/TLS** - Ensure encrypted connections
5. **Monitor access logs** - Review Aiven and platform logs regularly
6. **Keep dependencies updated** - Run `pnpm update` regularly

## Rollback Procedure

If a deployment causes issues:

1. **Vercel:** Go to Deployments tab and click "Rollback"
2. **Render:** Redeploy the previous commit or use "Rollback"
3. **Database:** Keep backups; Aiven provides automated backups

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Aiven Documentation](https://aiven.io/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Express Documentation](https://expressjs.com/)
