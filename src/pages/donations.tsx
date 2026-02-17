import { useState } from "react";
import {
    useDonations,
    useDonationStats,
    useCreateDonation,
    useUpdateDonation,
    useDeleteDonation,
    type DonationFormData,
    type DonationFilters,
} from "@/hooks/use-donations";
import { useIncidents } from "@/hooks/use-incidents";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    HandCoins,
    Plus,
    Search,
    Loader2,
    Pencil,
    Trash2,
    DollarSign,
    Package,
    Clock,
    CheckCircle2,
    Truck,
} from "lucide-react";
import { format } from "date-fns";
import type { DonationType, DonationStatus } from "@/types/enums";
import type { Donation } from "@/types/database";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";

const DONATION_TYPES: DonationType[] = [
    "monetary", "medical_supplies", "food", "water", "clothing", "shelter_materials", "equipment", "other",
];

const DONATION_STATUSES: DonationStatus[] = ["pledged", "received", "distributed"];

const STATUS_STYLE: Record<DonationStatus, string> = {
    pledged: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
    received: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    distributed: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
};

function formatLabel(s: string): string {
    return s.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default function DonationsPage() {
    const [filters, setFilters] = useState<DonationFilters>({});
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<(Donation & { profiles: { first_name: string; last_name: string } | null }) | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const { data: donations = [], isLoading } = useDonations(filters);
    const { data: stats } = useDonationStats();
    const { data: incidents = [] } = useIncidents();
    const createMut = useCreateDonation();
    const updateMut = useUpdateDonation();
    const deleteMut = useDeleteDonation();

    const openCreate = () => { setEditing(null); setDialogOpen(true); };
    const openEdit = (d: typeof donations[0]) => { setEditing(d); setDialogOpen(true); };

    const handleSubmit = (form: DonationFormData) => {
        if (editing) {
            updateMut.mutate({ id: editing.id, ...form }, { onSuccess: () => setDialogOpen(false) });
        } else {
            createMut.mutate(form, { onSuccess: () => setDialogOpen(false) });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Donations</h1>
                    <p className="text-sm text-muted-foreground">Track monetary and physical donations</p>
                </div>
                <Button className="gap-1.5" onClick={openCreate}>
                    <Plus className="h-4 w-4" />
                    Record Donation
                </Button>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard icon={<HandCoins className="h-4 w-4" />} color="text-amber-500" label="Total Count" value={stats.count} />
                    <StatCard icon={<DollarSign className="h-4 w-4" />} color="text-green-500" label="Monetary" value={`$${stats.totalMonetary.toLocaleString()}`} />
                    <StatCard icon={<Package className="h-4 w-4" />} color="text-blue-500" label="Items" value={stats.totalItems} />
                    <StatCard icon={<Clock className="h-4 w-4" />} color="text-yellow-500" label="Pledged" value={stats.pledged} />
                    <StatCard icon={<CheckCircle2 className="h-4 w-4" />} color="text-blue-500" label="Received" value={stats.received} />
                    <StatCard icon={<Truck className="h-4 w-4" />} color="text-green-500" label="Distributed" value={stats.distributed} />
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search donor..."
                        value={filters.search ?? ""}
                        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                        className="pl-8"
                        data-selectable
                    />
                </div>
                <Select value={filters.type || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, type: v === "__all__" ? "" : v as DonationType }))}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="All Types" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Types</SelectItem>
                        {DONATION_TYPES.map((t) => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Select value={filters.status || "__all__"} onValueChange={(v) => setFilters((f) => ({ ...f, status: v === "__all__" ? "" : v as DonationStatus }))}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Statuses</SelectItem>
                        {DONATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : donations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <HandCoins className="h-10 w-10 mb-2" />
                    <p className="text-sm">No donations found</p>
                </div>
            ) : (
                <div className="border rounded-lg overflow-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Donor</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Amount / Qty</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="w-[80px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {donations.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium text-sm">{d.donor_name}</p>
                                            {d.donor_contact && <p className="text-xs text-muted-foreground">{d.donor_contact}</p>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="text-xs">{formatLabel(d.type)}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {d.type === "monetary"
                                            ? `$${Number(d.amount || 0).toLocaleString()}`
                                            : `${d.quantity || 0}${d.unit ? ` ${d.unit}` : ""}`}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-xs ${STATUS_STYLE[d.status]}`}>
                                            {formatLabel(d.status)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {format(new Date(d.created_at), "MMM d, yyyy")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(d)}>
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget({ id: d.id, name: d.donor_name })}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Delete Confirmation */}
            <ConfirmDeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                onConfirm={() => {
                    if (deleteTarget) {
                        deleteMut.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
                    }
                }}
                title={`Delete donation from ${deleteTarget?.name}?`}
                description="This action cannot be undone. This will permanently delete this donation record."
                isPending={deleteMut.isPending}
            />

            {/* Create / Edit Dialog */}
            <DonationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSubmit={handleSubmit}
                isPending={createMut.isPending || updateMut.isPending}
                editing={editing}
                incidents={incidents}
            />
        </div>
    );
}

// ─── Sub-components ─────────────────────────────────────────────

function StatCard({ icon, color, label, value }: { icon: React.ReactNode; color: string; label: string; value: string | number }) {
    return (
        <Card>
            <CardContent className="pt-3 pb-2 px-3">
                <div className={`${color} mb-1`}>{icon}</div>
                <p className="text-lg font-bold leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </CardContent>
        </Card>
    );
}

function DonationDialog({
    open,
    onOpenChange,
    onSubmit,
    isPending,
    editing,
    incidents,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSubmit: (form: DonationFormData) => void;
    isPending: boolean;
    editing: Donation | null;
    incidents: { id: string; title: string }[];
}) {
    const [donorName, setDonorName] = useState("");
    const [donorContact, setDonorContact] = useState("");
    const [type, setType] = useState<DonationType>("monetary");
    const [description, setDescription] = useState("");
    const [amount, setAmount] = useState("");
    const [quantity, setQuantity] = useState("");
    const [unit, setUnit] = useState("");
    const [status, setStatus] = useState<DonationStatus>("pledged");
    const [incidentId, setIncidentId] = useState("");
    const [notes, setNotes] = useState("");

    // Reset form when dialog opens
    const handleOpenChange = (v: boolean) => {
        if (v && editing) {
            setDonorName(editing.donor_name);
            setDonorContact(editing.donor_contact ?? "");
            setType(editing.type);
            setDescription(editing.description ?? "");
            setAmount(editing.amount?.toString() ?? "");
            setQuantity(editing.quantity?.toString() ?? "");
            setUnit(editing.unit ?? "");
            setStatus(editing.status);
            setIncidentId(editing.incident_id ?? "");
            setNotes(editing.notes ?? "");
        } else if (v) {
            setDonorName(""); setDonorContact(""); setType("monetary"); setDescription("");
            setAmount(""); setQuantity(""); setUnit(""); setStatus("pledged"); setIncidentId(""); setNotes("");
        }
        onOpenChange(v);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            donor_name: donorName,
            donor_contact: donorContact || undefined,
            type,
            description: description || undefined,
            amount: type === "monetary" ? Number(amount) || undefined : undefined,
            quantity: type !== "monetary" ? Number(quantity) || undefined : undefined,
            unit: type !== "monetary" ? unit || undefined : undefined,
            status,
            incident_id: incidentId || undefined,
            notes: notes || undefined,
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editing ? "Edit Donation" : "Record Donation"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Label className="text-xs">Donor Name *</Label>
                            <Input value={donorName} onChange={(e) => setDonorName(e.target.value)} required data-selectable />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">Contact (email / phone)</Label>
                            <Input value={donorContact} onChange={(e) => setDonorContact(e.target.value)} data-selectable />
                        </div>
                        <div>
                            <Label className="text-xs">Type *</Label>
                            <Select value={type} onValueChange={(v) => setType(v as DonationType)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DONATION_TYPES.map((t) => <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs">Status *</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as DonationStatus)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {DONATION_STATUSES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {type === "monetary" ? (
                            <div className="col-span-2">
                                <Label className="text-xs">Amount ($)</Label>
                                <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} data-selectable />
                            </div>
                        ) : (
                            <>
                                <div>
                                    <Label className="text-xs">Quantity</Label>
                                    <Input type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} data-selectable />
                                </div>
                                <div>
                                    <Label className="text-xs">Unit</Label>
                                    <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. boxes, kg" data-selectable />
                                </div>
                            </>
                        )}
                        <div className="col-span-2">
                            <Label className="text-xs">Linked Incident</Label>
                            <Select value={incidentId || "__none__"} onValueChange={(v) => setIncidentId(v === "__none__" ? "" : v)}>
                                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {incidents.map((i) => <SelectItem key={i.id} value={i.id}>{i.title}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">Description</Label>
                            <Input value={description} onChange={(e) => setDescription(e.target.value)} data-selectable />
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs">Notes</Label>
                            <Input value={notes} onChange={(e) => setNotes(e.target.value)} data-selectable />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending || !donorName} className="gap-1.5">
                            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            {editing ? "Update" : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
