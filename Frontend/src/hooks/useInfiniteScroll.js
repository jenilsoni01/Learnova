import { useState, useEffect, useCallback, useRef } from 'react';

const useInfiniteScroll = (fetchFn, deps = []) => {
  const [items, setItems]         = useState([]);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);
  const sentinelRef               = useRef(null);
  const isFirstMount              = useRef(true);
  const loadingRef                = useRef(false);

  // Reset when filters/deps change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, deps);

  const loadMore = useCallback(async (pageToLoad) => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchFn(pageToLoad);
      setItems(prev =>
        pageToLoad === 1 ? res.data : [...prev, ...res.data]
      );
      setHasMore(res.pagination.hasNextPage);
      setPage(pageToLoad + 1);
    } catch (err) {
      setError('Failed to load. Please try again.');
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [fetchFn, hasMore]);

  // IntersectionObserver watching the sentinel div
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !loadingRef.current) loadMore(page); },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, page]);

  // Initial load
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; loadMore(1); }
  }, []);

  const reset = () => {
    setItems([]); setPage(1); setHasMore(true); setError(null);
    // Trigger a re-fetch from page 1
    setTimeout(() => loadMore(1), 0);
  };

  return { items, isLoading, hasMore, error, sentinelRef, reset, loadMore };
};

export default useInfiniteScroll;
