import { useState, useEffect, useCallback } from 'react';

export interface Route {
  path: string;
  params: Record<string, string>;
  query: Record<string, string>;
}

function parseHash(): Route {
  const hash = window.location.hash.slice(1) || '/';
  const [pathPart, queryPart] = hash.split('?');
  const query: Record<string, string> = {};
  if (queryPart) {
    new URLSearchParams(queryPart).forEach((v, k) => {
      query[k] = v;
    });
  }
  return { path: pathPart, params: {}, query };
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = path;
  }, []);

  return { route, navigate };
}

export function navigate(path: string) {
  window.location.hash = path;
}

// Match route patterns like /product/:id
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}
