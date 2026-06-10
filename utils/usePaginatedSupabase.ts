import { useCallback, useEffect, useState } from "react";

type PaginatedQueryResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
  count: number | null;
};

type PaginatedQuery<T> = (
  from: number,
  to: number
) => PromiseLike<PaginatedQueryResult<T>>;

export interface PaginatedResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  nextPage: () => void;
  prevPage: () => void;
  refetch: () => Promise<void>;
  page: number;
  pageSize: number;
  total: number | null;
}

export function usePaginatedSupabase<T>(
  queryPage: PaginatedQuery<T>,
  options?: { pageSize?: number }
): PaginatedResult<T> {
  const pageSize = options?.pageSize ?? 20;
  const [page, setPage] = useState(1);
  const [data, setData] = useState<T[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data: pageData, error: fetchError, count } = await queryPage(
      from,
      to
    );
    if (fetchError) {
      setError(fetchError.message);
      setData([]);
    } else {
      setData(pageData as T[]);
      setTotal(count ?? null);
    }
    setIsLoading(false);
  }, [page, pageSize, queryPage]);

  useEffect(() => {
    let isActive = true;

    Promise.resolve().then(async () => {
      if (isActive) {
        await fetchPage();
      }
    });

    return () => {
      isActive = false;
    };
  }, [fetchPage]);

  const nextPage = () => {
    if (total !== null && page * pageSize >= total) return;
    setPage((p) => p + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  return {
    data,
    isLoading,
    error,
    nextPage,
    prevPage,
    refetch: fetchPage,
    page,
    pageSize,
    total,
  };
}
