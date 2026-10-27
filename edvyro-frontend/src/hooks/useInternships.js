import { useCallback, useEffect, useState } from "react";
import { getInternships } from "../services/api";
import demoInternships from "../data/demoInternships";
import { extractInternships } from "../utils/extractInternships";

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true";

export function useInternships(queryParams = {}) {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const searchKey = JSON.stringify(queryParams);

  const reload = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    async function loadInternships() {
      setLoading(true);
      setError(null);

      try {
        let results;

        if (DEMO_MODE) {
          results = demoInternships;
        } else {
          const params = JSON.parse(searchKey);
          const response = await getInternships(params, {
            signal: controller.signal,
          });

          results = extractInternships(response);
        }

        if (!active) return;

        setInternships(results);
      } catch (err) {
        if (!active || controller.signal.aborted) return;

        setInternships([]);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load internships. Please try again."
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInternships();

    return () => {
      active = false;
      controller.abort();
    };
  }, [searchKey, retryCount]);

  return {
    internships,
    loading,
    error,
    reload,
  };
}

export default useInternships;
