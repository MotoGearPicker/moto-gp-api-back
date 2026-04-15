const publicUrl = process.env.S3_PUBLIC_URL ?? '';

/**
 * Convierte una key relativa de S3 en una URL pública absoluta.
 * Si el valor ya es una URL absoluta (empieza con http), lo devuelve tal cual.
 * Si no hay S3_PUBLIC_URL configurado, devuelve la key como está.
 */
export function resolveLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http')) return logoUrl;
  return publicUrl ? `${publicUrl}/${logoUrl}` : logoUrl;
}
