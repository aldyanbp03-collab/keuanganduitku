/**
 * Utility functions for formatting currency and number inputs with thousands separator dots (id-ID format)
 */

export function formatIDR(num: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(num || 0);
}

export function formatThousand(val: string | number): string {
  if (val === undefined || val === null || val === '') return '';
  const digits = val.toString().replace(/\D/g, '');
  if (!digits) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(digits, 10));
}

export function parseThousand(val: string | number): number {
  if (!val) return 0;
  const digits = val.toString().replace(/\D/g, '');
  return digits ? parseInt(digits, 10) : 0;
}
