# Helia Admin Dashboard

This is the admin dashboard for managing the Helia Game Credits Shop.

## Deployment to Vercel

### Option 1: Deploy from this directory

1. Navigate to this directory:
   ```bash
   cd admin-app
   ```

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. Set the entry point to `App.tsx` in this directory

### Option 2: Deploy from root with configuration

1. In your Vercel project settings:
   - Set **Root Directory** to: `admin-app`
   - Set **Framework Preset** to: `Vite` (or your chosen framework)
   - Entry file should be: `/admin-app/App.tsx`

## Environment Configuration

The admin app uses shared utilities from `/shared` folder which includes:
- Supabase configuration
- API utilities
- Shared types
- Game catalog constants

Make sure your Vercel deployment can access the parent `/shared` and `/components` directories.

## Access

- Default password: `admin123`
- For production, change the password in `/components/AdminPage.tsx`

## Features

- **Dashboard**: Sales analytics with daily and monthly reports
- **Order Management**: View and manage all orders with status updates
- **Product Management**: 
  - Add/Edit/Delete games
  - Manage product listings
  - Set prices and bonuses
  - Upload game images
  - Adjust card sizes (Normal/Wide)
- **Payment Methods**: Configure payment options with QR codes
- **Settings**: 
  - Banner management (up to 5 rotating banners)
  - Order method toggle (Messenger/Place Order)
- **Real-time Updates**: Orders auto-refresh every 5 seconds

## Dependencies

The admin app shares components from:
- `/components/AdminPage.tsx` - Main admin component
- `/shared` - Shared utilities, types, and constants
- `/styles` - Global styles
- `/supabase` - Backend functions

All imports are relative, so the deployment must include the entire project structure.

## Security Notes

- Change the default admin password before production deployment
- Consider implementing proper authentication (JWT, OAuth, etc.)
- Restrict admin URL access using environment variables or Vercel protection
- Regularly review order data and sales reports
