import { useState, useCallback } from "react";
import { useReportData, useRecentIncidents } from "@/hooks/use-reports";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileBarChart,
    Download,
    Loader2,
    AlertTriangle,
    Package,
    ListTodo,
    HandCoins,
    TrendingUp,
    Clock,
} from "lucide-react";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { format } from "date-fns";
import { toast } from "sonner";

type ReportType = "situation" | "incidents" | "resources" | "donations";

const REPORT_TYPES: { value: ReportType; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "situation", label: "Situation Report", icon: <FileBarChart className="h-5 w-5" />, desc: "Full overview of incidents, resources, tasks, and donations" },
    { value: "incidents", label: "Incident Summary", icon: <AlertTriangle className="h-5 w-5" />, desc: "Detailed list and breakdown of all incidents" },
    { value: "resources", label: "Resource Utilization", icon: <Package className="h-5 w-5" />, desc: "Resource status, type distribution, and assignments" },
    { value: "donations", label: "Donation Report", icon: <HandCoins className="h-5 w-5" />, desc: "Donation tracking by type, status, and totals" },
];

function formatLabel(s: string): string {
    return s
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

export default function ReportsPage() {
    const [reportType, setReportType] = useState<ReportType>("situation");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [generating, setGenerating] = useState(false);

    const dateRange = dateFrom && dateTo ? { from: new Date(dateFrom).toISOString(), to: new Date(dateTo + "T23:59:59").toISOString() } : undefined;

    const { data: reportData, isLoading } = useReportData(dateRange);
    const { data: recentIncidents = [] } = useRecentIncidents(100, dateRange);

    const handleGeneratePDF = useCallback(async () => {
        if (!reportData) return;
        setGenerating(true);
        try {
            const { default: jsPDF } = await import("jspdf");
            const autoTable = (await import("jspdf-autotable")).default;

            const doc = new jsPDF();
            const pageW = doc.internal.pageSize.getWidth();
            let y = 20;

            // Title
            doc.setFontSize(18);
            doc.setFont("helvetica", "bold");
            doc.text("DisasterConnect", pageW / 2, y, { align: "center" });
            y += 8;
            doc.setFontSize(14);
            doc.text(REPORT_TYPES.find((r) => r.value === reportType)?.label ?? "Report", pageW / 2, y, { align: "center" });
            y += 6;
            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");
            doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy h:mm a")}`, pageW / 2, y, { align: "center" });
            if (dateFrom && dateTo) {
                y += 4;
                doc.text(`Period: ${dateFrom} — ${dateTo}`, pageW / 2, y, { align: "center" });
            }
            y += 10;

            // ── Incidents Summary ────────────────────
            if (reportType === "situation" || reportType === "incidents") {
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Incidents Summary", 14, y);
                y += 2;

                autoTable(doc, {
                    startY: y,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Total Incidents", String(reportData.incidents.total)],
                        ...Object.entries(reportData.incidents.byStatus).map(([k, v]) => [`Status: ${formatLabel(k)}`, String(v)]),
                        ...Object.entries(reportData.incidents.bySeverity).map(([k, v]) => [`Severity: ${formatLabel(k)}`, String(v)]),
                    ],
                    theme: "grid",
                    headStyles: { fillColor: [59, 130, 246] },
                    margin: { left: 14, right: 14 },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            }

            // ── Incident Detail Table ────────────────
            if (reportType === "incidents" && recentIncidents.length > 0) {
                autoTable(doc, {
                    startY: y,
                    head: [["Title", "Type", "Severity", "Status", "Location", "Created"]],
                    body: recentIncidents.map((i: any) => [
                        i.title,
                        formatLabel(i.type),
                        formatLabel(i.severity),
                        formatLabel(i.status),
                        i.location_name ?? "—",
                        format(new Date(i.created_at), "MMM d, yyyy"),
                    ]),
                    theme: "grid",
                    headStyles: { fillColor: [239, 68, 68] },
                    margin: { left: 14, right: 14 },
                    styles: { fontSize: 8 },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            }

            // ── Resources Summary ────────────────────
            if (reportType === "situation" || reportType === "resources") {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Resources Summary", 14, y);
                y += 2;

                autoTable(doc, {
                    startY: y,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Total Resources", String(reportData.resources.total)],
                        ["Currently Assigned", String(reportData.resources.assigned)],
                        ...Object.entries(reportData.resources.byStatus).map(([k, v]) => [`Status: ${formatLabel(k)}`, String(v)]),
                        ...Object.entries(reportData.resources.byType).map(([k, v]) => [`Type: ${formatLabel(k)}`, String(v)]),
                    ],
                    theme: "grid",
                    headStyles: { fillColor: [34, 197, 94] },
                    margin: { left: 14, right: 14 },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            }

            // ── Tasks Summary ────────────────────────
            if (reportType === "situation") {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Tasks Summary", 14, y);
                y += 2;

                autoTable(doc, {
                    startY: y,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Total Tasks", String(reportData.tasks.total)],
                        ["Overdue", String(reportData.tasks.overdue)],
                        ...Object.entries(reportData.tasks.byStatus).map(([k, v]) => [`Status: ${formatLabel(k)}`, String(v)]),
                        ...Object.entries(reportData.tasks.byPriority).map(([k, v]) => [`Priority: ${formatLabel(k)}`, String(v)]),
                    ],
                    theme: "grid",
                    headStyles: { fillColor: [168, 85, 247] },
                    margin: { left: 14, right: 14 },
                });
                y = (doc as any).lastAutoTable.finalY + 8;
            }

            // ── Donations Summary ────────────────────
            if (reportType === "situation" || reportType === "donations") {
                if (y > 250) { doc.addPage(); y = 20; }
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Donations Summary", 14, y);
                y += 2;

                autoTable(doc, {
                    startY: y,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Total Monetary", `$${reportData.donations.totalMonetary.toLocaleString()}`],
                        ["Total Physical Items", String(reportData.donations.totalItems)],
                        ...Object.entries(reportData.donations.byStatus).map(([k, v]) => [`Status: ${formatLabel(k)}`, String(v)]),
                        ...Object.entries(reportData.donations.byType).map(([k, v]) => [`Type: ${formatLabel(k)}`, String(v)]),
                    ],
                    theme: "grid",
                    headStyles: { fillColor: [245, 158, 11] },
                    margin: { left: 14, right: 14 },
                });
            }

            // Footer
            const pages = doc.getNumberOfPages();
            for (let i = 1; i <= pages; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setFont("helvetica", "normal");
                doc.text(`DisasterConnect Report — Page ${i} of ${pages}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
            }

            const fileName = `DisasterConnect_${reportType}_${format(new Date(), "yyyy-MM-dd_HHmm")}.pdf`;

            // Use Tauri save dialog so the user can choose where to save
            const filePath = await save({
                defaultPath: fileName,
                filters: [{ name: "PDF", extensions: ["pdf"] }],
            });

            if (!filePath) {
                // User cancelled the dialog
                return;
            }

            const pdfBytes = doc.output("arraybuffer");
            await writeFile(filePath, new Uint8Array(pdfBytes));
            toast.success(`Report saved to ${filePath}`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to generate PDF");
        } finally {
            setGenerating(false);
        }
    }, [reportData, recentIncidents, reportType, dateFrom, dateTo]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
                    <p className="text-sm text-muted-foreground">
                        Generate PDF reports and view operational summaries
                    </p>
                </div>
                <Button
                    className="gap-1.5"
                    disabled={!reportData || generating}
                    onClick={handleGeneratePDF}
                >
                    {generating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="h-4 w-4" />
                    )}
                    Generate PDF
                </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="w-52">
                    <Label className="text-xs">Report Type</Label>
                    <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {REPORT_TYPES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>
                                    {r.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label className="text-xs">From</Label>
                    <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-40"
                        data-selectable
                    />
                </div>
                <div>
                    <Label className="text-xs">To</Label>
                    <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-40"
                        data-selectable
                    />
                </div>
            </div>

            {/* Report Type Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {REPORT_TYPES.map((r) => (
                    <Card
                        key={r.value}
                        className={`cursor-pointer transition-all hover:shadow-md ${reportType === r.value ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setReportType(r.value)}
                    >
                        <CardContent className="pt-4 pb-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className={`p-1.5 rounded-md ${reportType === r.value ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {r.icon}
                                </div>
                                <span className="font-medium text-sm">{r.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{r.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Data Preview */}
            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : reportData ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Incident Stats */}
                    {(reportType === "situation" || reportType === "incidents") && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    Incidents ({reportData.incidents.total})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(reportData.incidents.byStatus).map(([k, v]) => (
                                        <StatRow key={k} label={formatLabel(k)} value={v} />
                                    ))}
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">By Severity</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(reportData.incidents.bySeverity).map(([k, v]) => (
                                            <StatRow key={k} label={formatLabel(k)} value={v} />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Resource Stats */}
                    {(reportType === "situation" || reportType === "resources") && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <Package className="h-4 w-4 text-green-500" />
                                    Resources ({reportData.resources.total})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                        <span className="text-sm font-medium">{reportData.resources.assigned}</span>
                                        <span className="text-xs text-muted-foreground">assigned</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(reportData.resources.byStatus).map(([k, v]) => (
                                        <StatRow key={k} label={formatLabel(k)} value={v} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Task Stats */}
                    {reportType === "situation" && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <ListTodo className="h-4 w-4 text-purple-500" />
                                    Tasks ({reportData.tasks.total})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-red-500" />
                                        <span className="text-sm font-medium">{reportData.tasks.overdue}</span>
                                        <span className="text-xs text-muted-foreground">overdue</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(reportData.tasks.byStatus).map(([k, v]) => (
                                        <StatRow key={k} label={formatLabel(k)} value={v} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Donation Stats */}
                    {(reportType === "situation" || reportType === "donations") && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                                    <HandCoins className="h-4 w-4 text-amber-500" />
                                    Donations
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6 mb-3">
                                    <div>
                                        <p className="text-lg font-bold">${reportData.donations.totalMonetary.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Monetary</p>
                                    </div>
                                    <div>
                                        <p className="text-lg font-bold">{reportData.donations.totalItems.toLocaleString()}</p>
                                        <p className="text-xs text-muted-foreground">Items</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(reportData.donations.byStatus).map(([k, v]) => (
                                        <StatRow key={k} label={formatLabel(k)} value={v} />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            ) : null}
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{value}</span>
        </div>
    );
}
