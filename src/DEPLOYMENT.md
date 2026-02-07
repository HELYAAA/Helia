# Helia - Game Credits Top-up Service

A modern, full-featured game credits top-up platform with separate customer shop and admin dashboard deployments.

## Project Structure

```
/
├── shop-app/           # Customer-facing shop application
│   ├── App.tsx         # Shop entry point
│   └── README.md       # Shop deployment guide
│
├── admin-app/          # Admin dashboard application  
│   ├── App.tsx         # Admin entry point
│   └── README.md       # Admin deployment guide
│
├── shared/             # Shared utilities and types
│   ├── types.ts        # TypeScript interfaces
│   ├── constants.ts    # Game catalog and constants
│   ├── images.ts       # Game image exports
│   ├── api.ts          # Supabase API utilities
│   └── supabase-info.tsx  # Supabase configuration
│
├── components/         # Shared UI components
│   ├── HomePage.tsx
│   ├── OrderPage.tsx
│   ├── PaymentPage.tsx
│   ├── ProofPage.tsx
│   ├── CartPage.tsx
│   ├── TrackOrderPage.tsx
│   └── AdminPage.tsx
│
├── styles/            # Global styles
│   └── globals.css
│
├── supabase/          # Backend functions
│   └── functions/
│
└── App.tsx           # Original combined app (legacy)
```

## Two Separate Deployments

This project is structured to support **two independent Vercel deployments**:

### 1. Shop App (Customer-Facing)
- **Path**: `/shop-app/App.tsx`
- **Purpose**: Customer shop for browsing games, placing orders, and tracking orders
- **URL Example**: `helia-shop.vercel.app`

### 2. Admin App (Dashboard)
- **Path**: `/admin-app/App.tsx`
- **Purpose**: Admin dashboard for managing products, orders, and sales
- **URL Example**: `helia-admin.vercel.app`

Both apps:
- Share the same Supabase backend
- Use the same components from `/components`
- Share utilities from `/shared`
- Are fully independent and can be deployed separately

## Quick Start

### Deploy Shop App to Vercel

1. Create new Vercel project
2. Import this repository
3. Set **Root Directory** to: `shop-app`
4. Deploy

### Deploy Admin App to Vercel

1. Create another Vercel project  
2. Import the same repository
3. Set **Root Directory** to: `admin-app`
4. Deploy

## Features

### Shop Features
- 🎮 12+ supported games (Mobile Legends, PUBG, CODM, etc.)
- 🛒 Shopping cart functionality
- 💳 Multiple payment methods
- 📱 Mobile-responsive design
- 🎨 Gaming aesthetic with gradient backgrounds
- 📸 Receipt upload
- 🔍 Order tracking

### Admin Features
- 📊 Sales analytics dashboard
- 📦 Order management with status updates
- 🎮 Product catalog management
- 💰 Payment method configuration
- 🖼️ Banner management (up to 5 rotating banners)
- ⚙️ Site settings (Order method toggle)
- 🔄 Real-time order updates

## Supabase Backend

Both apps connect to the same Supabase project for:
- Product catalog storage
- Payment method configuration
- Order management
- Receipt file upload
- Sales tracking

Configuration is in `/shared/supabase-info.tsx`

## Development

To run locally:

```bash
# Install dependencies
npm install

# Run shop app
cd shop-app
npm run dev

# Run admin app (in separate terminal)
cd admin-app
npm run dev
```

## Tech Stack

- **Frontend**: React + TypeScript
- **Styling**: Tailwind CSS v4
- **Backend**: Supabase (PostgreSQL + Storage + Edge Functions)
- **Deployment**: Vercel
- **UI Components**: Custom components + Lucide icons
- **Charts**: Recharts
- **Notifications**: Sonner

## Benefits of Separate Deployments

1. **Security**: Admin dashboard on separate URL with different access controls
2. **Performance**: Each app optimized for its specific use case
3. **Scalability**: Independent scaling based on traffic patterns
4. **Maintenance**: Update shop or admin without affecting the other
5. **Flexibility**: Different deployment configurations, domains, or CDN setups

## Migration from Combined App

The original `App.tsx` at the root contained both shop and admin functionality. This has been split into:
- `/shop-app/App.tsx` - Contains only shop pages
- `/admin-app/App.tsx` - Contains only admin functionality
- Shared logic moved to `/shared` folder

The original `App.tsx` is kept for reference but is no longer used.

## License

© 2024 Helia Game Shop
