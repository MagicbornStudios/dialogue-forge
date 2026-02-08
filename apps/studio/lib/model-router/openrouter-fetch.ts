import 'server-only';

function isOpenRouterGenerationPath(pathname: string): boolean {
  return (
    pathname.includes('/chat/completions') ||
    pathname.includes('/responses') ||
    pathname.includes('/completions')
  );
}

function parseRequestUrl(input: RequestInfo | URL): URL | null {
  try {
    if (typeof input === 'string') {
      return new URL(input);
    }

    if (input instanceof URL) {
      return input;
    }

    return new URL((input as Request).url);
  } catch {
    return null;
  }
}

export function createFetchWithModelFallbacks(
  primary: string,
  fallbacks: string[],
  baseUrl: string,
  baseFetch: typeof fetch = fetch
): typeof fetch {
  const models = [primary, ...fallbacks].filter(
    (model, index, arr) => arr.indexOf(model) === index
  );
  const baseOrigin = new URL(baseUrl).origin;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const parsed = parseRequestUrl(input);
    if (!parsed || parsed.origin !== baseOrigin || !isOpenRouterGenerationPath(parsed.pathname)) {
      return baseFetch(input, init);
    }

    if (!init?.body) {
      return baseFetch(input, init);
    }

    const bodyText =
      typeof init.body === 'string'
        ? init.body
        : init.body instanceof Uint8Array
          ? new TextDecoder().decode(init.body)
          : null;

    if (!bodyText) {
      return baseFetch(input, init);
    }

    try {
      const body = JSON.parse(bodyText) as Record<string, unknown>;
      body.models = models;

      return baseFetch(input, {
        ...init,
        body: JSON.stringify(body),
      });
    } catch {
      return baseFetch(input, init);
    }
  };
}
