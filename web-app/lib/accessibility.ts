/**
 * Accessibility utility functions
 */

// Convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// Calculate relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio between two colors
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Check if contrast ratio meets WCAG standards
export function meetsWCAG(
  ratio: number,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  if (level === 'AA') {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
  } else {
    // AAA
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
}

// Check color contrast
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): {
  ratio: number;
  AA: boolean;
  AAA: boolean;
  rating: 'fail' | 'AA' | 'AAA';
} {
  const ratio = getContrastRatio(foreground, background);
  const AA = meetsWCAG(ratio, 'AA', isLargeText);
  const AAA = meetsWCAG(ratio, 'AAA', isLargeText);

  return {
    ratio,
    AA,
    AAA,
    rating: AAA ? 'AAA' : AA ? 'AA' : 'fail',
  };
}

// Verify color combinations used in the app
export const colorCombinations = {
  // Primary colors
  primaryOnWhite: checkColorContrast('#F6C7A6', '#FFFFFF'), // primary-500 on white
  primaryOnCream: checkColorContrast('#F6C7A6', '#FFF9F0'), // primary-500 on cream-100

  // Text colors
  textOnWhite: checkColorContrast('#1F2937', '#FFFFFF'), // neutral-900 on white
  textOnCream: checkColorContrast('#1F2937', '#FFF9F0'), // neutral-900 on cream-100

  // Button colors
  whiteOnPrimary: checkColorContrast('#FFFFFF', '#F6C7A6'), // white text on primary-500
  primaryOnWhiteButton: checkColorContrast('#F6C7A6', '#FFFFFF'), // primary-500 text on white

  // Status colors
  successOnWhite: checkColorContrast('#10B981', '#FFFFFF'), // success on white
  errorOnWhite: checkColorContrast('#EF4444', '#FFFFFF'), // error on white
  warningOnWhite: checkColorContrast('#F59E0B', '#FFFFFF'), // warning on white
};

// Log color contrast results (for development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.group('Color Contrast Analysis');
  Object.entries(colorCombinations).forEach(([name, result]) => {
    const icon = result.rating === 'AAA' ? '✅' : result.rating === 'AA' ? '✓' : '❌';
    console.log(`${icon} ${name}: ${result.ratio.toFixed(2)}:1 (${result.rating})`);
  });
  console.groupEnd();
}

// Screen reader utilities
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof window === 'undefined') return;

  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Focus management
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll(selector));
}

export function trapFocus(container: HTMLElement): () => void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  };

  container.addEventListener('keydown', handleKeyDown);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    container.removeEventListener('keydown', handleKeyDown);
  };
}

// Reduce motion preference
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// High contrast mode detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  );
}
