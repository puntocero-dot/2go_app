/**
 * Retry con exponential backoff
 * Útil para reintentar operaciones que pueden fallar temporalmente
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === maxRetries - 1;
      
      if (isLastAttempt) {
        throw error;
      }
      
      // Calcular delay con exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry con jitter (añade aleatoriedad al delay)
 * Útil para evitar thundering herd en múltiples clientes
 */
export async function retryWithJitter<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000,
    onRetry 
  } = options;
  
  let lastError: unknown;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }
      
      // Delay con jitter: baseDelay + random(0, baseDelay)
      const jitter = Math.random() * baseDelay;
      const delay = Math.min(baseDelay * (attempt + 1) + jitter, maxDelay);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Wrapper para fetch con retry automático
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryOptions: {
    maxRetries?: number;
    initialDelay?: number;
    retryOn?: number[];
  } = {}
): Promise<Response> {
  const { 
    maxRetries = 3, 
    initialDelay = 1000,
    retryOn = [408, 429, 500, 502, 503, 504]
  } = retryOptions;
  
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      
      // Si el status está en la lista de retry, lanzar error
      if (retryOn.includes(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    },
    {
      maxRetries,
      initialDelay,
      onRetry: (attempt, error) => {
        console.warn(`[fetchWithRetry] Intento ${attempt} fallido:`, error);
      }
    }
  );
}
