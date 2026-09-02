import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

/**
 * Prev/next pager shown under any full-list table, e.g. "21-30 of 47".
 * Renders nothing when everything already fits on one page, so it's safe
 * to always mount alongside a table without a conditional at each call
 * site.
 */
export function TablePagination({
  page,
  pageCount,
  pageSize,
  totalCount,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between border-t border-border px-3 py-2.5">
      <p className="text-xs text-muted-foreground">
        {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <CaretLeft className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-16 text-center text-xs text-muted-foreground">
          Page {page} of {pageCount}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <CaretRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
