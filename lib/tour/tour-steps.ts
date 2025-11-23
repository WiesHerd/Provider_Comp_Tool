import { TourStep } from './tour-context';
import { 
  Sparkles, 
  Home, 
  Calculator, 
  TrendingUp, 
  Phone, 
  BarChart3, 
  FolderOpen,
  Target,
  DollarSign,
  Users,
  Calendar,
  Activity,
  FileText,
  CheckCircle2
} from 'lucide-react';

export const TOUR_STEPS: TourStep[] = [
  // Welcome & Home
  {
    id: 'welcome',
    screen: '/',
    title: 'Welcome to CompLens™',
    description: 'CompLens is your comprehensive tool for provider compensation modeling and FMV (Fair Market Value) analysis. Whether you\'re planning compensation structures, analyzing market benchmarks, or modeling call pay scenarios, CompLens helps you make informed decisions.\n\nThis tour will guide you through all the features and help you understand how to use each tool effectively.',
    icon: 'Sparkles',
    position: 'center',
  },
  {
    id: 'home-overview',
    screen: '/',
    title: 'Explore the Tools',
    description: 'CompLens offers four powerful tools:\n\n• **wRVU & Incentive Modeler**: Estimate work Relative Value Units and calculate productivity incentives\n• **FMV Calculator**: Perform fast FMV reasonableness checks and percentile analysis\n• **Call Pay Modeler**: Model call-pay structures with annualized outputs\n• **Provider Schedule & wRVU Forecaster**: Forecast annual wRVUs based on your schedule\n\nClick on any tool card to get started, or continue the tour to learn about each one.',
    highlight: 'home-tools',
    icon: 'Home',
    position: 'bottom',
  },
  
  // wRVU Modeler
  {
    id: 'wrvu-intro',
    screen: '/wrvu-modeler',
    title: 'wRVU & Incentive Modeler',
    description: 'This tool helps you estimate work Relative Value Units (wRVUs) and calculate productivity-based incentives. You can model different compensation scenarios by adjusting FTE, annual wRVUs, and conversion factors.\n\nLet\'s explore each section step by step.',
    icon: 'Calculator',
    position: 'center',
  },
  {
    id: 'wrvu-fte',
    screen: '/wrvu-modeler',
    title: 'Full-Time Equivalent (FTE)',
    description: 'FTE represents the proportion of a full-time position. Use the slider to adjust from 0.1 (10% time) to 1.0 (100% full-time).\n\nThis affects all calculations including base salary, wRVU targets, and incentive calculations. The FTE value is displayed prominently at the top.',
    highlight: 'wrvu-fte',
    icon: 'Users',
    position: 'bottom',
  },
  {
    id: 'wrvu-input',
    screen: '/wrvu-modeler',
    title: 'Annual wRVU Input',
    description: 'Enter your annual work Relative Value Units here. You can input:\n\n• **Annual total**: Enter the full year wRVU target\n• **Monthly average**: Automatically calculates annual\n• **Monthly breakdown**: Enter wRVUs for each month individually\n\nThis is used to calculate productivity incentives and compare against market benchmarks.',
    highlight: 'wrvu-input',
    icon: 'Activity',
    position: 'bottom',
  },
  {
    id: 'wrvu-conversion',
    screen: '/wrvu-modeler',
    title: 'Conversion Factors',
    description: 'Conversion factors determine how wRVUs translate into compensation:\n\n• **Base Conversion Factor**: Used for base salary calculation\n• **Productivity Conversion Factor**: Used for incentive calculations above the threshold\n• **wRVU Threshold**: The wRVU target that must be met before productivity incentives apply\n\nAdjust these to model different compensation structures.',
    highlight: 'wrvu-conversion',
    icon: 'Target',
    position: 'bottom',
  },
  {
    id: 'wrvu-incentives',
    screen: '/wrvu-modeler',
    title: 'Incentive Calculations',
    description: 'The model automatically calculates:\n\n• **Base Salary**: FTE × Base Conversion Factor × wRVU Threshold\n• **Productivity Incentive**: (Annual wRVUs - Threshold) × Productivity Conversion Factor\n• **Total Compensation**: Base + Incentive\n\nAll calculations are displayed in real-time as you adjust inputs. You can save scenarios to compare different models.',
    highlight: 'wrvu-results',
    icon: 'DollarSign',
    position: 'top',
  },
  
  // FMV Calculator
  {
    id: 'fmv-intro',
    screen: '/fmv-calculator',
    title: 'FMV Calculator',
    description: 'The FMV Calculator helps you perform fast Fair Market Value reasonableness checks. You can analyze compensation across three key metrics:\n\n• **TCC (Total Cash Compensation)**: Base salary + incentives\n• **CF (Conversion Factor)**: Dollars per wRVU\n• **wRVU**: Work Relative Value Units\n\nSelect a metric to begin your analysis.',
    highlight: 'fmv-selector',
    icon: 'TrendingUp',
    position: 'bottom',
  },
  {
    id: 'fmv-tcc',
    screen: '/fmv-calculator/tcc',
    title: 'TCC Calculator',
    description: 'The TCC (Total Cash Compensation) calculator helps you:\n\n• Enter provider compensation data\n• Input market benchmark percentiles (25th, 50th, 75th)\n• See where your compensation falls in the market\n• Analyze TCC components (base, incentives, etc.)\n• Get percentile rankings and FMV assessments\n\nThis helps ensure compensation is within fair market value ranges.',
    highlight: 'fmv-tcc-content',
    icon: 'DollarSign',
    position: 'top',
  },
  {
    id: 'fmv-cf',
    screen: '/fmv-calculator/cf',
    title: 'CF Calculator',
    description: 'The Conversion Factor (CF) calculator analyzes dollars per wRVU:\n\n• Enter your conversion factor\n• Input market benchmark data\n• See percentile rankings\n• Compare against market standards\n\nConversion factors typically range from $40-$80 per wRVU depending on specialty and market.',
    highlight: 'fmv-cf-content',
    icon: 'Target',
    position: 'top',
  },
  {
    id: 'fmv-wrvu',
    screen: '/fmv-calculator/wrvu',
    title: 'wRVU Calculator',
    description: 'The wRVU calculator helps you:\n\n• Enter annual wRVU targets or actuals\n• Compare against market benchmarks\n• See percentile rankings\n• Assess productivity expectations\n\nThis is useful for setting realistic wRVU targets and understanding productivity expectations in your market.',
    highlight: 'fmv-wrvu-content',
    icon: 'Activity',
    position: 'top',
  },
  
  // Call Pay Modeler
  {
    id: 'call-pay-intro',
    screen: '/call-pay-modeler',
    title: 'Call Pay Modeler',
    description: 'The Call Pay Modeler helps you structure and budget call coverage payments. You can model:\n\n• Per-call stipends\n• Per-shift rates\n• Tiered call structures (C1, C2, C3, etc.)\n• Annual call pay budgets\n\nLet\'s walk through setting up a call pay structure step by step.',
    icon: 'Phone',
    position: 'center',
  },
  {
    id: 'call-pay-context',
    screen: '/call-pay-modeler',
    title: 'Set Your Context',
    description: 'Start by entering your call coverage context:\n\n• **Specialty**: Select your medical specialty\n• **Service Line**: Enter the hospital or service line name\n• **Providers on Call**: Number of providers in the rotation\n• **Rotation Ratio**: How often each provider takes call (1-in-N format)\n• **Model Year**: The year for your calculations\n\nThis context is used to calculate call distribution and annual budgets.',
    highlight: 'call-pay-context',
    icon: 'Users',
    position: 'bottom',
  },
  {
    id: 'call-pay-tiers',
    screen: '/call-pay-modeler',
    title: 'Configure Call Tiers',
    description: 'Call tiers represent different levels of call coverage:\n\n• **C1 (First Call)**: Primary on-call with highest frequency\n• **C2 (Second Call)**: Backup coverage\n• **C3-C5**: Additional tiers as needed\n\nFor each tier, you can:\n• Set coverage type (In-house, home call, etc.)\n• Choose payment method (daily rate, stipend, etc.)\n• Enter rates for weekday, weekend, and holidays\n• Set call burden (calls per month)\n\nEnable only the tiers you need.',
    highlight: 'call-pay-tiers',
    icon: 'Target',
    position: 'top',
  },
  {
    id: 'call-pay-budget',
    screen: '/call-pay-modeler',
    title: 'Review Your Budget',
    description: 'The budget summary shows:\n\n• **Annual Call Pay**: Total cost for all enabled tiers\n• **Monthly Breakdown**: Cost per month\n• **Per-Provider Cost**: Average cost per provider\n• **Budget Comparison**: Compare against your target budget\n\nYou can set a target budget to see if you\'re over or under. All calculations update automatically as you adjust tiers and rates.',
    highlight: 'call-pay-budget',
    icon: 'DollarSign',
    position: 'top',
  },
  
  // wRVU Forecaster
  {
    id: 'forecaster-intro',
    screen: '/wrvu-forecaster',
    title: 'Provider Schedule & wRVU Forecaster',
    description: 'This tool helps you forecast annual wRVUs and compensation based on:\n\n• Your work schedule (shifts, days per week)\n• Patient encounter patterns\n• wRVU per encounter rates\n• Productivity metrics\n\nPerfect for planning annual productivity and compensation based on your actual schedule.',
    icon: 'BarChart3',
    position: 'center',
  },
  {
    id: 'forecaster-schedule',
    screen: '/wrvu-forecaster',
    title: 'Work Schedule',
    description: 'Enter your work schedule:\n\n• **Shift Types**: Add different shift types (clinic, OR, etc.)\n• **Days per Week**: How many days you work each week\n• **Weeks per Year**: Account for vacation and time off\n• **Hours per Shift**: Duration of each shift type\n\nYou can add multiple shift types and the tool will calculate total work hours and days.',
    highlight: 'forecaster-schedule',
    icon: 'Calendar',
    position: 'bottom',
  },
  {
    id: 'forecaster-encounters',
    screen: '/wrvu-forecaster',
    title: 'Patient Encounters',
    description: 'Define your patient encounter patterns:\n\n• **Encounters per Shift**: Average number of patients per shift type\n• **wRVU per Encounter**: Work RVUs generated per patient\n• **Encounter Types**: Different encounter types (new patient, follow-up, procedure, etc.)\n\nThis helps forecast total annual wRVUs based on your actual patient volume and encounter mix.',
    highlight: 'forecaster-encounters',
    icon: 'Activity',
    position: 'bottom',
  },
  {
    id: 'forecaster-productivity',
    screen: '/wrvu-forecaster',
    title: 'Productivity Summary',
    description: 'The productivity summary shows:\n\n• **Annual wRVU Forecast**: Total wRVUs based on schedule and encounters\n• **Monthly Breakdown**: wRVUs per month\n• **Compensation Projection**: Estimated compensation based on conversion factors\n• **Productivity Metrics**: wRVUs per shift, per hour, etc.\n\nUse this to plan your annual productivity goals and understand compensation potential.',
    highlight: 'forecaster-productivity',
    icon: 'BarChart3',
    position: 'top',
  },
  
  // Scenarios
  {
    id: 'scenarios-overview',
    screen: '/scenarios',
    title: 'Save & Manage Scenarios',
    description: 'All tools allow you to save your work as scenarios:\n\n• **Save Scenarios**: Click "Save Scenario" in any tool to save your current inputs\n• **Load Scenarios**: Use the "Load Saved Scenario" dropdown to reload previous work\n• **Manage Scenarios**: View all saved scenarios on this page\n• **Compare Options**: Save multiple scenarios to compare different models\n\nScenarios are saved in your browser and persist across sessions.',
    highlight: 'scenarios-list',
    icon: 'FolderOpen',
    position: 'top',
  },
  
  // Completion
  {
    id: 'completion',
    screen: '/',
    title: 'Tour Complete!',
    description: 'Congratulations! You\'ve completed the CompLens tour.\n\n**What\'s Next?**\n\n• Start modeling with the **wRVU & Incentive Modeler**\n• Check FMV reasonableness with the **FMV Calculator**\n• Structure call coverage with the **Call Pay Modeler**\n• Forecast productivity with the **wRVU Forecaster**\n\n**Tips:**\n• Save scenarios frequently to compare options\n• Use the info button (ℹ️) in the header for help on any screen\n• All calculations update in real-time as you adjust inputs\n\nReady to get started? Click any tool card above to begin!',
    icon: 'CheckCircle2',
    position: 'center',
  },
];

// Helper to get icon component from string
export function getTourIcon(iconName?: string) {
  const icons: Record<string, any> = {
    Sparkles,
    Home,
    Calculator,
    TrendingUp,
    Phone,
    BarChart3,
    FolderOpen,
    Target,
    DollarSign,
    Users,
    Calendar,
    Activity,
    FileText,
    CheckCircle2,
  };
  return icons[iconName || 'Sparkles'] || Sparkles;
}

