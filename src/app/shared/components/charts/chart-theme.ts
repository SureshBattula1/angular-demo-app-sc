/** Read a theme CSS variable written by the active dashboard theme. */
export function chartCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

export function chartTextColor(): string {
  return chartCssVar('--neutral-color', '#424242');
}

export function chartGridColor(): string {
  return hexToRgba(chartCssVar('--neutral-color', '#6B7280'), 0.22);
}

export function chartSurfaceColor(): string {
  return chartCssVar('--card-background', chartCssVar('--surface-color', '#ffffff'));
}

export function chartTooltipColor(): string {
  return chartCssVar('--primary-color', '#1565c0');
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '').trim();
  if (h.length !== 6) {
    return `rgba(107,114,128,${alpha})`;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(channel => Number.isNaN(channel))) {
    return `rgba(107,114,128,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}
