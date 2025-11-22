# Mobile Provider Compensation Companion

A mobile-first web application for provider compensation modeling, FMV (Fair Market Value) analysis, and call-pay scenario planning. Built with Next.js, TypeScript, and Tailwind CSS, optimized for mobile devices.

## Features

### 1. wRVU Modeler
- Estimate wRVUs and productivity incentives
- FTE (Full-Time Equivalent) normalization
- Annual or monthly wRVU input
- Conversion factor calculations
- Save scenarios for later reference

### 2. FMV Quick Calculator
- Fast FMV reasonableness checks
- TCC (Total Cash Compensation) component management
- Market benchmark percentile analysis
- Visual percentile comparisons
- FMV signal indicators (Standard Range, Enhanced Scrutiny, High Scrutiny)

### 3. Call Pay Modeler
- Model three call-pay structures:
  - Per-call stipend
  - Per-shift / per-24h coverage
  - Tiered call pay
- Annualized outputs
- Integration with TCC components

### 4. Scenarios Management
- Save, edit, and duplicate scenarios
- Compare multiple scenarios
- Persistent storage via localStorage
- Detailed scenario views with percentile analysis

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: Zustand
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/WiesHerd/Provider_Comp_Tool.git
cd Provider_Comp_Tool
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Deployment to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Vercel will automatically detect Next.js and configure the build settings
4. Deploy!

The app will be available at `https://your-project.vercel.app`

### Environment Variables

No environment variables are required for basic functionality. All data is stored locally in the browser's localStorage.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── wrvu-modeler/      # wRVU modeling tool
│   ├── fmv-calculator/    # FMV calculator
│   ├── call-pay-modeler/  # Call pay modeling
│   └── scenarios/         # Scenario management
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── wrvu/            # wRVU-specific components
│   ├── fmv/             # FMV calculator components
│   ├── call-pay/        # Call pay components
│   ├── scenarios/       # Scenario components
│   ├── layout/          # Layout components
│   └── navigation/      # Navigation components
├── lib/                 # Utilities and stores
│   ├── store/           # Zustand stores
│   └── utils/          # Utility functions
├── types/               # TypeScript type definitions
└── public/             # Static assets
    ├── manifest.json   # PWA manifest
    └── icons/         # App icons
```

## Key Features

### Mobile-First Design
- Optimized for phone screens (320px+)
- Large tap targets (minimum 44x44px)
- Touch-friendly inputs and controls
- Bottom navigation for mobile, top tabs for desktop
- Safe area insets for iOS devices

### PWA Support
- Web app manifest
- Service worker (basic caching)
- Installable on mobile devices
- Offline-capable (basic)

### Data Persistence
- Scenarios saved to localStorage
- Persists between browser sessions
- No backend required

## Calculations

### Percentile Interpolation
Uses piecewise linear interpolation between known benchmark points (25th, 50th, 75th, 90th percentiles) to estimate provider percentile rankings.

### FTE Normalization
All values are normalized to 1.0 FTE for fair comparison:
- `normalizedTcc = totalTcc / fte`
- `normalizedWrvus = annualWrvus / fte`

### Effective Conversion Factor
Calculated as: `effectiveCF = normalizedTcc / normalizedWrvus`

## Testing

Unit tests are located in `/lib/utils/__tests__/`:
- `percentile.test.ts` - Percentile calculation tests
- `normalization.test.ts` - FTE normalization tests
- `call-pay.test.ts` - Call pay calculation tests

Run tests with:
```bash
npm test
```

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

ISC

## Disclaimer

**For education and planning only. Not legal or FMV advice.**

This tool is designed to assist with compensation modeling and analysis. It should not be used as a substitute for professional legal, financial, or FMV consulting services.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues or questions, please open an issue on GitHub.

