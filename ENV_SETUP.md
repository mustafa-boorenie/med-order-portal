# Environment Variables Setup

## Frontend (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3333
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_STRIPE_PUBLISHABLE_KEY

# Auth0 Configuration (if using Auth0)
AUTH0_SECRET=YOUR_AUTH0_SECRET
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://YOUR_DOMAIN.auth0.com
AUTH0_CLIENT_ID=YOUR_CLIENT_ID
AUTH0_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

## Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/med_order_portal

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_YOUR_STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET

# Frontend URL (for generating checkout links)
FRONTEND_URL=http://localhost:3000

# Email Configuration (for production)
# Using SendGrid
SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY
EMAIL_FROM=noreply@yourcompany.com

# OR Using AWS SES
# AWS_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY
# AWS_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_KEY
# AWS_REGION=us-east-1
# EMAIL_FROM=noreply@yourcompany.com

# SMS Configuration (for production)
# Using Twilio
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=+1234567890

# Auth0 Configuration (if using Auth0)
AUTH0_AUDIENCE=YOUR_API_IDENTIFIER
AUTH0_ISSUER_URL=https://YOUR_DOMAIN.auth0.com/
```

## Getting Started

1. Copy the example files:
   ```bash
   cp frontend/env.example frontend/.env.local
   cp backend/env.example backend/.env
   ```

2. Update the values with your actual credentials

3. For Stripe:
   - Get your keys from [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
   - Set up webhook endpoint at `http://localhost:3333/payments/webhooks/stripe`
   - Copy the webhook signing secret

4. For Email/SMS (Production):
   - SendGrid: Sign up at [sendgrid.com](https://sendgrid.com)
   - Twilio: Sign up at [twilio.com](https://www.twilio.com)

## Security Notes

- Never commit `.env` or `.env.local` files to version control
- Use strong, unique values for JWT_SECRET
- Rotate secrets regularly in production
- Use environment-specific values (test keys for development, live keys for production)