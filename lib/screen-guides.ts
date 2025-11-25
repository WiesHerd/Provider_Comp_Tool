// Simple screen guide content for each page
// These are shown as centered modals when users first visit each screen

export const SCREEN_GUIDES = {
  home: {
    title: 'Welcome to CompLens™',
    description: 'CompLens is your comprehensive tool for provider compensation modeling and FMV (Fair Market Value) analysis.\n\n**Four Powerful Tools:**\n\n• **wRVU & Incentive Modeler**: Estimate work Relative Value Units and calculate productivity incentives\n• **FMV Calculator**: Perform fast FMV reasonableness checks and percentile analysis\n• **Call Pay Modeler**: Model call-pay structures with annualized outputs\n• **Provider Schedule & wRVU Forecaster**: Forecast annual wRVUs based on your schedule\n\nClick on any tool card to get started!',
    storageKey: 'complens-home-guide-seen',
  },
  wrvuModeler: {
    title: 'wRVU & Incentive Modeler',
    description: 'This tool helps you estimate work Relative Value Units (wRVUs) and calculate productivity-based incentives.\n\n**How to use:**\n\n• **FTE Slider**: Adjust from 0.1 (10% time) to 1.0 (100% full-time)\n• **Annual wRVU Input**: Enter your annual wRVU target or monthly breakdown\n• **Conversion Factors**: Set base and productivity conversion rates\n• **Results**: See base salary, productivity incentives, and total compensation calculated in real-time\n\nAll calculations update automatically as you adjust inputs. Save scenarios to compare different models.',
    storageKey: 'complens-wrvu-modeler-guide-seen',
  },
  fmvCalculator: {
    title: 'FMV Calculator',
    description: 'The FMV Calculator helps you perform fast Fair Market Value reasonableness checks.\n\n**Three Metrics:**\n\n• **TCC (Total Cash Compensation)**: Base salary + incentives\n• **CF (Conversion Factor)**: Dollars per wRVU\n• **wRVU**: Work Relative Value Units\n\n**How to use:**\n\n1. Select a metric (TCC, CF, or wRVU)\n2. Enter your provider data\n3. Input market benchmark percentiles (25th, 50th, 75th)\n4. See where your compensation falls in the market\n\nThis helps ensure compensation is within fair market value ranges.',
    storageKey: 'complens-fmv-calculator-guide-seen',
  },
  callPayModeler: {
    title: 'Call Pay Modeler',
    description: 'The Call Pay Modeler helps you structure and budget call coverage payments.\n\n**How to use:**\n\n1. **Set Context**: Enter specialty, providers on call, and rotation ratio\n2. **Configure Tiers**: Set up call tiers (C1, C2, etc.) with coverage types and payment methods\n3. **Enter Rates**: Set weekday, weekend, and holiday rates for each tier\n4. **Review Budget**: See annual call pay budget and monthly breakdown\n\nYou can model per-call stipends, per-shift rates, or tiered call structures. All calculations update automatically.',
    storageKey: 'complens-call-pay-modeler-guide-seen',
  },
  wrvuForecaster: {
    title: 'Provider Schedule & wRVU Forecaster',
    description: 'This tool helps you forecast annual wRVUs and compensation based on your schedule.\n\n**How to use:**\n\n1. **Work Schedule**: Enter shift types, days per week, weeks per year, and hours per shift\n2. **Patient Encounters**: Set encounters per shift and wRVU per encounter\n3. **Productivity Summary**: See annual wRVU forecast, monthly breakdown, and compensation projection\n\nPerfect for planning annual productivity and compensation based on your actual schedule and patient load.',
    storageKey: 'complens-wrvu-forecaster-guide-seen',
  },
  scenarios: {
    title: 'Save & Manage Scenarios',
    description: 'All tools allow you to save your work as scenarios.\n\n**Features:**\n\n• **Save Scenarios**: Click "Save Scenario" in any tool to save your current inputs\n• **Load Scenarios**: Use the "Load Saved Scenario" dropdown to reload previous work\n• **Manage Scenarios**: View all saved scenarios on this page\n• **Compare Options**: Save multiple scenarios to compare different models\n\nScenarios are saved in your browser and persist across sessions.',
    storageKey: 'complens-scenarios-guide-seen',
  },
  providerWRVUTracking: {
    title: 'Provider Work RVU Tracking',
    description: 'Track your daily patients and work RVUs by month to reconcile with compensation reports.\n\n**How to use this screen:**\n\n1. **Enter Daily Data**: Click on any calendar day cell to enter the number of patients and work RVUs for that day\n2. **Multi-Select Feature**: Click multiple dates to select them (they will show a green border), then enter data once to apply the same values to all selected dates - perfect for entering the same values across multiple days\n3. **Navigate Months**: Use the arrow buttons (◀ ▶) to move between months, or click "Today" to jump to the current month\n4. **View Modes**: Toggle between Week and Month view using the buttons in the header\n5. **Monthly Summary**: Scroll down to see monthly totals, averages, and insights automatically calculated from your entries\n6. **Provider Name**: Optionally enter a provider name at the top to identify this tracking data\n\n**Tips:**\n\n• Double-click a day cell to quickly clear its data\n• Today\'s date is highlighted with a green border\n• Your data is automatically saved and will persist when you return\n• Use multi-select to quickly enter the same values for multiple days (e.g., if you saw 13 patients on Monday and Tuesday, select both days and enter once)',
    storageKey: 'complens-provider-wrvu-tracking-guide-seen',
  },
};



