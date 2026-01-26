const SUPPORTED_URL_PROTOCOLS = [
  'http:',
  'https:',
  'mailto:',
  'sms:',
  'tel:',
];

export function sanitizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    if (SUPPORTED_URL_PROTOCOLS.includes(parsedUrl.protocol)) {
      return url;
    }
  } catch {
    // If URL parsing fails, try adding https://
    return `https://${url}`;
  }
  return 'https://';
}
