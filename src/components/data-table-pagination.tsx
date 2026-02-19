import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface DataTablePaginationProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function DataTablePagination({
    page,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [25, 50, 100],
}: DataTablePaginationProps) {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-muted-foreground shrink-0">
                {totalCount === 0
                    ? "No results"
                    : `${from}\u2013${to} of ${totalCount}`}
            </p>

            <div className="flex items-center gap-2">
                {onPageSizeChange && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">Rows</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(v) => onPageSizeChange(Number(v))}
                        >
                            <SelectTrigger className="h-8 w-[65px] text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pageSizeOptions.map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(1)}
                        disabled={page <= 1}
                        aria-label="First page"
                    >
                        <ChevronsLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>

                    <span className="text-xs text-muted-foreground px-2 min-w-[60px] text-center">
                        {page} / {totalPages}
                    </span>

                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                        aria-label="Next page"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onPageChange(totalPages)}
                        disabled={page >= totalPages}
                        aria-label="Last page"
                    >
                        <ChevronsRight className="h-3.5 w-3.5" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
