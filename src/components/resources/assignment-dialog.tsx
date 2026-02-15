import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatResourceType } from "@/components/resources/resource-badges";
import {
  useAvailableResources,
  useAssignResource,
} from "@/hooks/use-resources";
import { Search, Loader2, Package, Check } from "lucide-react";
import { toast } from "sonner";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incidentId: string;
  incidentTitle: string;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  incidentId,
  incidentTitle,
}: AssignmentDialogProps) {
  const [search, setSearch] = useState("");
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());

  const { data: resources, isLoading } = useAvailableResources(
    search || undefined
  );
  const assignMutation = useAssignResource();

  const handleAssign = async (resourceId: string) => {
    try {
      await assignMutation.mutateAsync({
        resourceId,
        incidentId,
      });
      setAssignedIds((prev) => new Set(prev).add(resourceId));
      toast.success("Resource assigned");
    } catch {
      toast.error("Failed to assign resource");
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSearch("");
      setAssignedIds(new Set());
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Assign Resource to {incidentTitle}
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-selectable
            placeholder="Search available resources..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Resources Table */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !resources || resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No available resources match your search."
                  : "No available resources found."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((res) => {
                  const justAssigned = assignedIds.has(res.id);
                  return (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">
                        {res.name}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatResourceType(res.type)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {res.capacity ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                        {res.location_name || "—"}
                      </TableCell>
                      <TableCell>
                        {justAssigned ? (
                          <Button size="sm" variant="ghost" disabled className="gap-1">
                            <Check className="h-3.5 w-3.5 text-green-600" />
                            Assigned
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAssign(res.id)}
                            disabled={assignMutation.isPending}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
