export interface DocumentCacheIndicatorProps {
  readonly cached: boolean;
  readonly online: boolean;
}

export function DocumentCacheIndicator({ cached, online }: DocumentCacheIndicatorProps) {
  const label = cached ? (online ? "Cached and synced" : "Available offline") : "Not cached";
  return <span role="status" aria-label="Document cache status">{label}</span>;
}
