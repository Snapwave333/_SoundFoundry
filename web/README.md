# SoundFoundry Frontend

Next.js 16 frontend application for SoundFoundry AI Music Generator.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server/Client Components
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Utility-first CSS framework
- **React Query v5** - Data fetching and caching
- **Zustand** - Client state management
- **Radix UI** - Accessible component primitives
- **NextAuth** - Authentication
- **Playwright** - End-to-end testing

## Project Structure

```
web/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   │   ├── create/        # Track creation page
│   │   ├── library/       # User's track library
│   │   └── settings/      # User settings
│   ├── (marketing)/       # Public routes
│   │   └── landing/       # Landing page
│   ├── api/               # Next.js API routes
│   │   ├── auth/          # NextAuth routes
│   │   └── tokens/        # Design tokens API
│   ├── share/             # Public track sharing
│   │   └── [id]/          # Share page by track ID
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page (redirects)
├── components/            # React components
│   ├── ui/                # Radix UI primitives
│   ├── AudioPlayer.tsx    # Audio playback component
│   ├── ReferenceUpload.tsx # Reference file upload
│   └── ...                # Other components
├── lib/                   # Utilities and libraries
│   ├── api/               # API client and hooks
│   │   ├── client.ts      # API client wrapper
│   │   └── hooks.ts       # React Query hooks
│   ├── auth.ts            # NextAuth configuration
│   ├── providers.tsx      # React Query provider
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
│   └── useStyleSystem.ts  # Style system hook
├── styles/                # Global styles
│   └── globals.css        # Tailwind imports and custom CSS
├── mocks/                 # MSW mock handlers (dev)
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXT_PUBLIC_USE_MSW=false
```

### Build

```bash
npm run build
npm run start
```

## Features

### Track Creation (`/create`)

- Text-to-music generation with natural language prompts
- Optional lyrics for vocal tracks
- Reference audio upload with automatic analysis (BPM, key)
- Adjustable parameters:
  - Duration (15-240 seconds)
  - Genre presets
  - Key selection
  - Tempo (BPM)
  - Style strength (0.0-1.0)
  - Seed (for reproducibility)
- Real-time job progress tracking
- Cost preview before generation

### Library (`/library`)

- View all generated tracks
- Search and filter tracks
- Play preview audio
- Download tracks and stems
- Share tracks publicly
- Regenerate cover art (visual versioning)

### Settings (`/settings`)

- Credit balance display
- PPP band selection
- Solidarity pricing toggle
- Pricing breakdown view
- Style system unlocks

### Style System

- Visual series for grouping tracks
- Unique palettes and geometry per user
- Style unlocks based on track count
- Cover art generation
- Visual versioning

## API Integration

### React Query Hooks

Located in `lib/api/hooks.ts`:

- `useCreateTrack()` - Create new track
- `useTrack(trackId)` - Get track details
- `useJob(jobId)` - Get job status (auto-refetches)
- `useCredits()` - Get credit balance
- `useCostPreview(duration)` - Preview credit cost
- `useAnalyzeReference()` - Analyze reference audio
- `usePublishTrack()` - Toggle public/private
- `useSeries()` - Get user's series
- `useStyleUnlocks()` - Get style unlocks

### API Client

Located in `lib/api/client.ts`:

- Centralized fetch wrapper
- 30-second timeout
- Error handling with user-friendly messages
- Supports JSON and blob responses
- Base URL from `NEXT_PUBLIC_API_URL`

## Styling

### Tailwind CSS v4

- Utility-first CSS framework
- Custom design tokens (see `TOKENS_README.md`)
- Dark mode support via `next-themes`
- Responsive design with mobile-first approach

### Design Tokens

Design tokens are defined in:
- `lib/design-tokens.ts` - Token definitions
- `lib/theme/` - Theme utilities

See `TOKENS_README.md` for details.

## Testing

### End-to-End Tests

```bash
npm run test:e2e
npm run test:e2e:ui  # Interactive UI mode
```

Uses Playwright for browser automation.

### Linting

```bash
npm run lint
```

### Token Linting

```bash
npm run lint:tokens
```

Checks for hardcoded colors (should use design tokens).

## Mocking (Development)

When `NEXT_PUBLIC_USE_MSW=true`, the app uses MSW (Mock Service Worker) to mock API responses. This enables frontend development without a running backend.

Mock handlers are in `mocks/handlers.ts`.

## Authentication

Uses NextAuth for authentication. Configuration in `lib/auth.ts`.

## Deployment

### Vercel (Recommended)

1. Connect GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Docker

```bash
docker build -t soundfoundry-web .
docker run -p 3000:3000 soundfoundry-web
```

### Environment Variables for Production

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_APP_NAME=SoundFoundry
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=https://yourdomain.com
```

## Performance Optimization

- Code splitting by route (`(app)/`, `(marketing)/`)
- Lazy loading for heavy components
- Image optimization via Next.js Image component
- Font optimization via `next/font`
- React Query caching and deduplication

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

1. Follow TypeScript best practices
2. Use design tokens for colors/spacing
3. Write tests for new features
4. Follow the existing component structure
5. Use React Query for data fetching
6. Keep components small and focused

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/)
