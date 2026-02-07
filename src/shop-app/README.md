# Helia Shop Application

This is the customer-facing shop application for Helia Game Credits Top-up Service.

## Deployment to Vercel

### Option 1: Deploy from this directory

1. Navigate to this directory:
   ```bash
   cd shop-app
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set the entry point to `App.tsx` in this directory

### Option 2: Deploy from root with configuration

1. In your Vercel project settings:
   - Set **Root Directory** to: `shop-app`
   - Set **Framework Preset** to: `Vite` (or your chosen framework)
   - Entry file should be: `/shop-app/App.tsx`

## Environment Configuration

The shop app uses shared utilities from `/shared` folder which includes:
- Supabase configuration
- API utilities
- Shared types
- Game catalog constants

Make sure your Vercel deployment can access the parent `/shared` and `/components` directories.

## Features

- Browse game catalog
- Add items to cart
- Multiple game support (Mobile Legends, PUBG, CODM, etc.)
- Payment processing
- Receipt upload
- Order tracking
- Responsive design

## Dependencies

The shop app shares components from:
- `/components` - UI components (HomePage, OrderPage, PaymentPage, etc.)
- `/shared` - Shared utilities, types, and constants
- `/styles` - Global styles
- `/supabase` - Backend functions

All imports are relative, so the deployment must include the entire project structure.
