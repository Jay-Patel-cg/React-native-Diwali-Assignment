import { useCallback, useState } from 'react';

/**
 * Reusable hook to execute any service call with unified loading & error states.
 */
export const useApiRequest = (asyncFn, { initialData = null } = {}) => {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await asyncFn(...args);
        setData(result?.data !== undefined ? result.data : result);
        return result;
      } catch (err) {
        const message = err?.message || 'Something went wrong. Please try again.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [asyncFn]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  return { data, isLoading, error, execute, reset, setData };
};

export default useApiRequest;

