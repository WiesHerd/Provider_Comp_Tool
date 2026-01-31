import ScenarioDetailClient from './ScenarioDetailClient';

// Required for static export - provide at least one static param
export function generateStaticParams() {
  // Return a placeholder param for static export
  // The actual routing will be handled client-side
  return [{ id: ['index'] }];
}

export default function ScenarioDetailPage() {
  return <ScenarioDetailClient />;
}

