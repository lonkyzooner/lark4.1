# LARK Launch Checklist

This document outlines the steps required to properly launch the LARK application in production.

## Environment Variables

Ensure all required environment variables are set in your production environment:

### Authentication
- [ ] `VITE_AUTH0_DOMAIN`
- [ ] `VITE_AUTH0_CLIENT_ID`
- [ ] `VITE_AUTH0_AUDIENCE`
- [ ] `AUTH0_AUDIENCE`
- [ ] `AUTH0_ISSUER_BASE_URL`
- [ ] `AUTH0_MANAGEMENT_CLIENT_ID`
- [ ] `AUTH0_MANAGEMENT_CLIENT_SECRET`
- [ ] `JWT_SECRET`

### Stripe Integration
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] All Stripe price IDs (see .env.example)

### LiveKit Integration
- [ ] `VITE_LIVEKIT_URL`
- [ ] `VITE_LIVEKIT_API_KEY`
- [ ] `VITE_LIVEKIT_API_SECRET`

### AI Services
- [ ] `VITE_OPENAI_API_KEY`
- [ ] `VITE_HUGGINGFACE_API_KEY`

### Database & Server
- [ ] `MONGODB_URI`
- [ ] `PORT`
- [ ] `NODE_ENV` (set to "production")
- [ ] `FRONTEND_URL`
- [ ] `VITE_API_BASE_URL`
- [ ] `ALLOWED_ORIGINS`

## Security Checks

- [ ] No API keys or secrets in code or version control
- [ ] CORS properly configured for production domains
- [ ] Rate limiting enabled for all API endpoints
- [ ] Input validation on all API endpoints
- [ ] Authentication required for protected routes
- [ ] Secure headers configured (HSTS, CSP, etc.)
- [ ] SSL/TLS enabled for all connections

## Database Setup

- [ ] MongoDB database created and secured
- [ ] Database indexes created for performance
- [ ] Database backups configured
- [ ] Connection string properly formatted and tested

## Stripe Configuration

- [ ] Stripe webhook endpoint configured in Stripe dashboard
- [ ] Webhook signing secret added to environment variables
- [ ] Test transactions completed successfully
- [ ] Subscription products and prices created in Stripe dashboard
- [ ] Customer portal configured

## Auth0 Configuration

- [ ] Application registered in Auth0 dashboard
- [ ] Callback URLs configured
- [ ] Logout URLs configured
- [ ] API permissions and scopes configured
- [ ] Rules or Actions set up for custom claims
- [ ] Management API credentials secured

## Deployment

- [ ] Frontend built with production flags
- [ ] Backend configured for production
- [ ] Static assets optimized and cached
- [ ] Database migrations run
- [ ] Health check endpoints configured
- [ ] Monitoring and logging set up

## Testing

- [ ] Authentication flow tested
- [ ] Subscription flow tested
- [ ] Voice recognition features tested
- [ ] LiveKit integration tested
- [ ] Error handling and fallbacks tested
- [ ] Mobile responsiveness tested
- [ ] Cross-browser compatibility tested

## Post-Launch

- [ ] Monitor error logs
- [ ] Set up alerts for critical errors
- [ ] Monitor API usage and quotas
- [ ] Check subscription webhooks are processing correctly
- [ ] Verify database performance

## Rollback Plan

In case of critical issues:

1. Identify the issue through monitoring
2. If frontend issue, roll back to previous version
3. If backend issue, roll back API server
4. If database issue, restore from latest backup
5. Communicate with users about the issue and resolution timeline

