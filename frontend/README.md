# Warframe Trade Helper - Frontend

Modern React frontend for the Warframe Trade Helper application.

## Tech Stack

- **React 18**: Latest React with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **Vitest**: Fast unit testing
- **React Testing Library**: Component testing

## Features

- Real-time WebSocket updates
- Sortable and searchable data table
- Responsive design
- Light theme with gradient accents
- LocalStorage persistence for settings
- Smooth animations and transitions

## Development

### Setup

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Open http://localhost:5173

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Testing

```bash
# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

### Linting & Formatting

```bash
# Lint
npm run lint

# Format
npm run format
```

## Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── ConnectionIndicator.tsx
│   ├── DataTable.tsx
│   ├── FrameDetails.tsx
│   ├── FrameRow.tsx
│   ├── LoadingSpinner.tsx
│   ├── PlatformSelector.tsx
│   ├── ProfitChip.tsx
│   ├── Sparkline.tsx
│   ├── StrategySelector.tsx
│   ├── ThresholdControls.tsx
│   └── __tests__/    # Component tests
├── pages/            # Page components
│   └── Dashboard.tsx
├── hooks/            # Custom React hooks
│   ├── useSettings.ts
│   └── useWebSocket.ts
├── lib/              # Utilities and libraries
│   ├── api.ts        # API client
│   ├── constants.ts  # Constants
│   ├── format.ts     # Formatting utilities
│   ├── storage.ts    # LocalStorage utilities
│   ├── types.ts      # TypeScript types
│   └── tailwind.css  # Global styles
├── test/             # Test setup
│   └── setup.ts
├── App.tsx           # Root component
├── main.tsx          # Entry point
└── vite-env.d.ts     # Vite types
```

## Components

### DataTable

Main table component with sorting, filtering, and search.

**Props:**
- `opportunities: Opportunity[]` - List of opportunities
- `onViewDetails: (frameId: string) => void` - Callback for viewing details
- `isLoading?: boolean` - Loading state

### FrameRow

Individual table row for a Warframe opportunity.

**Props:**
- `opportunity: Opportunity` - Opportunity data
- `onViewDetails: (frameId: string) => void` - Callback for details

### FrameDetails

Modal dialog showing detailed information about a frame.

**Props:**
- `frameId: string` - Frame to display
- `onClose: () => void` - Close callback

### PlatformSelector

Dropdown for selecting platform (PC, PS4, Xbox, Switch).

**Props:**
- `value: Platform` - Current platform
- `onChange: (platform: Platform) => void` - Change callback

### StrategySelector

Dropdown for selecting pricing strategy.

**Props:**
- `value: Strategy` - Current strategy
- `onChange: (strategy: Strategy) => void` - Change callback

### ThresholdControls

Input controls for min profit and margin thresholds.

**Props:**
- `minProfit: number` - Min profit value
- `minMargin: number` - Min margin value
- `onMinProfitChange: (value: number) => void`
- `onMinMarginChange: (value: number) => void`

### ProfitChip

Displays profit amount with color-coded styling.

**Props:**
- `profit: number` - Profit in platinum
- `margin: number` - Profit margin (0-1)
- `size?: 'sm' | 'md' | 'lg'` - Size variant

### Sparkline

Simple SVG sparkline chart for price trends.

**Props:**
- `data: number[]` - Data points
- `width?: number` - SVG width
- `height?: number` - SVG height
- `color?: string` - Line color

### ConnectionIndicator

Shows WebSocket connection status.

**Props:**
- `isConnected: boolean` - Connection state
- `lastUpdate: string | null` - Last update timestamp

### LoadingSpinner

Animated loading indicator.

**Props:**
- `size?: 'sm' | 'md' | 'lg'` - Size variant
- `className?: string` - Additional classes

## Hooks

### useWebSocket

Manages WebSocket connection to backend.

**Returns:**
- `opportunities: Opportunity[]` - Current opportunities
- `isConnected: boolean` - Connection status
- `lastUpdate: string | null` - Last update time
- `sendConfig: (config) => void` - Send config to server

### useSettings

Manages user settings with localStorage persistence.

**Returns:**
- `settings: UserSettings` - Current settings
- `updateSettings: (updates) => void` - Update settings

## API Client

The `api` object provides methods for REST API calls:

```typescript
import { api } from './lib/api';

// Get health status
const health = await api.getHealth();

// Get configuration
const config = await api.getConfig();

// Get all frames
const frames = await api.getFrames();

// Get opportunities with filters
const opportunities = await api.getOpportunities({
  min_profit: 10,
  min_margin: 0.2,
  strategy: 'balanced',
  platform: 'pc'
});

// Get frame details
const details = await api.getFrameDetail('mesa_prime');
```

## Styling

### Tailwind Configuration

Custom theme with gradient colors:
- Primary: Light blue shades
- Secondary: Purple shades

### Custom CSS Classes

Defined in `lib/tailwind.css`:

- `.btn` - Base button
- `.btn-primary` - Primary button with gradient
- `.btn-secondary` - Secondary button
- `.card` - Card container
- `.input` - Form input
- `.badge` - Small badge
- `.badge-primary` - Primary badge with gradient

### Animations

- `animate-pulse-subtle` - Subtle pulse effect
- `animate-slide-up` - Slide up animation
- `.row-updated` - Row update flash
- `.threshold-alert` - Threshold crossed alert

## Environment Variables

Configure via `.env` file:

```bash
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ JavaScript features
- WebSocket support required

## Performance

- Code splitting with Vite
- Memoized computations with useMemo
- Efficient WebSocket updates
- Optimized re-renders

## Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation
- Focus management

## Known Limitations

- No offline support
- Requires active backend connection
- Browser localStorage required for settings

## Future Enhancements

- Dark theme toggle
- Notifications API for alerts
- More detailed analytics
- Export to CSV
- Customizable columns

