import { useState, useRef, useCallback, useMemo } from "react";
import {
    useDocuments,
    useUploadDocument,
    useDeleteDocument,
    useDownloadUrl,
    type DocumentFilters,
} from "@/hooks/use-documents";
import { useIncidents } from "@/hooks/use-incidents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    FileText,
    Upload,
    Search,
    Loader2,
    Trash2,
    Download,
    FileImage,
    FileArchive,
    File,
    FileSpreadsheet,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useAuthStore } from "@/stores/auth-store";

function fileIcon(mime: string | null) {
    if (!mime) return <File className="h-5 w-5 text-muted-foreground" />;
    if (mime.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
    if (mime.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (mime.includes("zip") || mime.includes("rar") || mime.includes("tar")) return <FileArchive className="h-5 w-5 text-amber-500" />;
    if (mime.includes("sheet") || mime.includes("csv") || mime.includes("excel")) return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
    if (mime.includes("text") || mime.includes("doc")) return <FileText className="h-5 w-5 text-purple-500" />;
    return <File className="h-5 w-5 text-muted-foreground" />;
}

function formatSize(bytes: number | null): string {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function DocumentsPage() {
    const [filters, setFilters] = useState<DocumentFilters>({});
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; filePath: string; name: string } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [uploadIncident, setUploadIncident] = useState("");

    const userId = useAuthStore((s) => s.user?.id);
    const isAdmin = useAuthStore((s) => s.profile?.role === "administrator");
    const { data: allDocuments = [], isLoading } = useDocuments(filters);
    const paginatedDocuments = useMemo(() => {
        const start = (page - 1) * pageSize;
        return allDocuments.slice(start, start + pageSize);
    }, [allDocuments, page, pageSize]);
    const { data: incidents = [] } = useIncidents();
    const uploadMut = useUploadDocument();
    const deleteMut = useDeleteDocument();
    const getDownloadUrl = useDownloadUrl();

    const handleFiles = useCallback(
        async (files: FileList | File[]) => {
            setUploading(true);
            for (const file of Array.from(files)) {
                try {
                    await uploadMut.mutateAsync({
                        file,
                        incidentId: uploadIncident || undefined,
                    });
                } catch {
                    // error toast handled in hook
                }
            }
            setUploading(false);
        },
        [uploadMut, uploadIncident]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    const handleDownload = useCallback(
        async (filePath: string, name: string) => {
            try {
                const url = await getDownloadUrl(filePath);
                const a = document.createElement("a");
                a.href = url;
                a.download = name;
                a.click();
            } catch {
                toast.error("Failed to generate download link");
            }
        },
        [getDownloadUrl]
    );

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
                    <p className="text-sm text-muted-foreground">Upload, manage, and download files</p>
                </div>
                <Button className="gap-1.5" onClick={() => fileRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Upload
                </Button>
                <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => e.target.files && handleFiles(e.target.files)}
                />
            </div>

            {/* Upload Zone */}
            <Card
                className={`border-2 border-dashed transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/20"}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
            >
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <Upload className={`h-8 w-8 mb-2 ${dragOver ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm font-medium">{dragOver ? "Drop files here" : "Drag & drop files, or click to browse"}</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, images, spreadsheets, and more</p>
                    <div className="mt-3 w-52">
                        <Select value={uploadIncident || "__none__"} onValueChange={(v) => setUploadIncident(v === "__none__" ? "" : v)}>
                            <SelectTrigger className="text-xs h-8" onClick={(e) => e.stopPropagation()}>
                                <SelectValue placeholder="Link to incident (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">None</SelectItem>
                                {incidents.map((i) => (
                                    <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={filters.search ?? ""}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                        className="pl-8"
                        data-selectable
                    />
                </div>
                <Select value={filters.incidentId || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, incidentId: v === "__all__" ? "" : v }))}>
                    <SelectTrigger className="w-48"><SelectValue placeholder="All Incidents" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Incidents</SelectItem>
                        {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Document Table */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : allDocuments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-3">
                        <FileText className="h-7 w-7 opacity-50" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No documents found</p>
                    <p className="text-xs mt-1 max-w-xs text-center">Upload reports, maps, and other files to share with your team.</p>
                    <Button className="mt-4 gap-1.5" variant="outline" onClick={() => fileRef.current?.click()}>
                        <Upload className="h-4 w-4" />
                        Upload First Document
                    </Button>
                </div>
            ) : (
                <div className="border rounded-lg overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>File</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedDocuments.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {fileIcon(d.mime_type)}
                                            <span className="text-sm font-medium truncate max-w-[200px]">{d.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{formatSize(d.file_size)}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-[10px]">{d.mime_type?.split("/").pop() ?? "file"}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {d.profiles ? `${d.profiles.first_name} ${d.profiles.last_name}` : "—"}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(d.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7"
                                                onClick={() => handleDownload(d.file_path, d.name)}
                                                aria-label="Download file"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                            </Button>
                                            {(isAdmin || d.uploaded_by === userId) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive"
                                                    onClick={() => setDeleteTarget({ id: d.id, filePath: d.file_path, name: d.name })}
                                                    aria-label="Delete document"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Pagination */}
            {allDocuments.length > 0 && (
                <div className="px-4 py-2">
                    <DataTablePagination
                        page={page}
                        pageSize={pageSize}
                        totalCount={allDocuments.length}
                        onPageChange={setPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size);
                            setPage(1);
                        }}
                    />
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteMut.mutate(
                            { id: deleteTarget.id, filePath: deleteTarget.filePath },
                            { onSuccess: () => setDeleteTarget(null) }
                        );
                    }
                }}
                title={`Delete "${deleteTarget?.name}"?`}
                description="This action cannot be undone. The file will be permanently removed from storage."
                isPending={deleteMut.isPending}
            />
        </div>
    );
}
