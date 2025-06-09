import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getCsrfToken(): Promise<string> {
  try {
    const csrfRes = await fetch('/api/csrf-token', {
      credentials: 'include'
    });
    if (csrfRes.ok) {
      const tokenData = await csrfRes.json();
      return tokenData.csrfToken;
    } else {
      console.error('Failed to fetch CSRF token:', await csrfRes.text());
      return '';
    }
  } catch (error) {
    console.error('Error fetching CSRF token:', error);
    return '';
  }
}

export async function apiRequest<T = any>(
  url: string,
  options?: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  }
): Promise<T> {
  const { method = 'GET', body, headers = {} } = options || {};
  
  const requestHeaders: Record<string, string> = {
    ...headers
  };
  
  if (body && !headers['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  
  // Add CSRF token for mutation requests (POST, PUT, PATCH, DELETE)
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutationMethods.includes(method.toUpperCase())) {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      requestHeaders['X-CSRF-Token'] = csrfToken;
    }
  }
  
  const res = await fetch(url, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
