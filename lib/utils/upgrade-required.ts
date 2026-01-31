export type UpgradeRequiredDetail = {
  href?: string;
  reason?: string;
};

/**
 * Centralized helper to prompt the upgrade flow.
 * `RouteGuard` listens for this event and shows the upgrade modal.
 */
export function dispatchUpgradeRequired(detail?: UpgradeRequiredDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('complens:upgrade-required', { detail }));
}


