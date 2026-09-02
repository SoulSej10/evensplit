import { useMemo, useState } from "react";

/**
 * Client-side pagination over an already-fetched array - every list in
 * this app is loaded in full via one Supabase query already (no server
 * cursor), so slicing here is enough rather than re-plumbing every query.
 * `page` is clamped into range automatically (e.g. after a delete shrinks
 * the list below the current page), so callers never need to reset it
 * themselves.
 */
export function usePagination<T>(items: T[], pageSize = 10) {
  const [pageState, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(pageState, pageCount);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageCount,
    pageItems,
    totalCount: items.length,
    pageSize,
  };
}
