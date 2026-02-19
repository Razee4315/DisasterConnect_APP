import { useState } from "react";
import {
    useTasks,
    useCreateTask,
    useUpdateTask,
    useDeleteTask,
    useProfiles,
    type TaskFilters,
    type TaskWithProfiles,
    type CreateTaskInput,
} from "@/hooks/use-tasks";
import { useIncidents } from "@/hooks/use-incidents";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Plus,
    Search,
    LayoutGrid,
    List,
    Calendar,
    GripVertical,
    MoreHorizontal,
    Pencil,
    Trash2,
    Loader2,
    ListTodo,
    AlertTriangle,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { toast } from "sonner";
import type { TaskPriority, TaskStatus } from "@/types/enums";

// ─── Constants ───────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
    TaskPriority,
    { label: string; color: string; bgColor: string }
> = {
    urgent: {
        label: "Urgent",
        color: "text-red-500",
        bgColor: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    high: {
        label: "High",
        color: "text-orange-500",
        bgColor: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    },
    medium: {
        label: "Medium",
        color: "text-yellow-500",
        bgColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    },
    low: {
        label: "Low",
        color: "text-green-500",
        bgColor: "bg-green-500/10 text-green-500 border-green-500/20",
    },
};

const KANBAN_COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
    { status: "pending", label: "Pending", color: "border-t-gray-500" },
    {
        status: "in_progress",
        label: "In Progress",
        color: "border-t-blue-500",
    },
    { status: "completed", label: "Completed", color: "border-t-green-500" },
    { status: "cancelled", label: "Cancelled", color: "border-t-red-500" },
];

// ─── Task Card ───────────────────────────────────────────────────

function TaskCard({
    task,
    onEdit,
    onDelete,
    onStatusChange,
    draggable = false,
}: {
    task: TaskWithProfiles;
    onEdit: (task: TaskWithProfiles) => void;
    onDelete?: (id: string) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
    draggable?: boolean;
}) {
    const priority = PRIORITY_CONFIG[task.priority];
    const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "completed" && task.status !== "cancelled";
    const assigneeName = task.assignee
        ? `${task.assignee.first_name} ${task.assignee.last_name}`
        : null;
    const assigneeInitials = task.assignee
        ? `${task.assignee.first_name[0]}${task.assignee.last_name[0]}`.toUpperCase()
        : null;

    return (
        <Card
            draggable={draggable}
            onDragStart={(e) => {
                e.dataTransfer.setData("taskId", task.id);
                e.dataTransfer.effectAllowed = "move";
            }}
            className={`group transition-all hover:shadow-md ${draggable ? "cursor-grab active:cursor-grabbing" : ""
                } ${isOverdue ? "border-red-500/40" : ""}`}
        >
            <CardContent className="p-3 space-y-2">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        {draggable && (
                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 inline-block mr-1.5 -ml-0.5" />
                        )}
                        <span className="text-sm font-medium leading-tight">
                            {task.title}
                        </span>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(task)}>
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {task.status !== "completed" && (
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "completed")}
                                >
                                    Complete
                                </DropdownMenuItem>
                            )}
                            {task.status !== "cancelled" && (
                                <DropdownMenuItem
                                    onClick={() => onStatusChange(task.id, "cancelled")}
                                >
                                    Cancel
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onDelete(task.id)}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        Delete
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Incident link */}
                {task.incident && (
                    <p className="text-xs text-muted-foreground truncate">
                        <AlertTriangle className="h-3 w-3 inline-block mr-1" />
                        {task.incident.title}
                    </p>
                )}

                {/* Footer: priority, assignee, due date */}
                <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${priority.bgColor}`}>
                        {priority.label}
                    </Badge>

                    {assigneeName && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-[9px] bg-muted">
                                        {assigneeInitials}
                                    </AvatarFallback>
                                </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>{assigneeName}</TooltipContent>
                        </Tooltip>
                    )}

                    {task.due_date && (
                        <span
                            className={`text-[10px] flex items-center gap-0.5 ml-auto ${isOverdue ? "text-red-500 font-medium" : "text-muted-foreground"
                                }`}
                        >
                            <Calendar className="h-3 w-3" />
                            {format(new Date(task.due_date), "MMM d")}
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Kanban Board ────────────────────────────────────────────────

function KanbanBoard({
    tasks,
    onEdit,
    onDelete,
    onStatusChange,
}: {
    tasks: TaskWithProfiles[];
    onEdit: (task: TaskWithProfiles) => void;
    onDelete?: (id: string) => void;
    onStatusChange: (id: string, status: TaskStatus) => void;
}) {
    const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

    const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
        e.preventDefault();
        setDragOver(null);
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) {
            const task = tasks.find((t) => t.id === taskId);
            if (task && task.status !== targetStatus) {
                onStatusChange(taskId, targetStatus);
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 h-full min-h-0">
            {KANBAN_COLUMNS.map((col) => {
                const columnTasks = tasks.filter((t) => t.status === col.status);
                const isOver = dragOver === col.status;

                return (
                    <div
                        key={col.status}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setDragOver(col.status);
                        }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={(e) => handleDrop(e, col.status)}
                        className={`flex flex-col rounded-lg border bg-muted/30 border-t-2 ${col.color
                            } ${isOver ? "ring-2 ring-primary/30 bg-primary/5" : ""}`}
                    >
                        {/* Column header */}
                        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
                            <h3 className="text-sm font-medium">{col.label}</h3>
                            <Badge variant="secondary" className="text-[10px] h-5 min-w-5 px-1.5">
                                {columnTasks.length}
                            </Badge>
                        </div>

                        {/* Cards */}
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {columnTasks.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-8">
                                    No tasks
                                </p>
                            ) : (
                                columnTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                        onStatusChange={onStatusChange}
                                        draggable
                                    />
                                ))
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Task Form Dialog ────────────────────────────────────────────

function TaskFormDialog({
    open,
    onOpenChange,
    editTask,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editTask: TaskWithProfiles | null;
}) {
    const createTask = useCreateTask();
    const updateTask = useUpdateTask();
    const { data: profiles = [] } = useProfiles();
    const { data: incidents = [] } = useIncidents();

    const [title, setTitle] = useState(editTask?.title ?? "");
    const [description, setDescription] = useState(editTask?.description ?? "");
    const [priority, setPriority] = useState<TaskPriority>(editTask?.priority ?? "medium");
    const [status, setStatus] = useState<TaskStatus>(editTask?.status ?? "pending");
    const [assignedTo, setAssignedTo] = useState(editTask?.assigned_to ?? "");
    const [incidentId, setIncidentId] = useState(editTask?.incident_id ?? "");
    const [dueDate, setDueDate] = useState(
        editTask?.due_date ? editTask.due_date.slice(0, 10) : ""
    );

    const isPending = createTask.isPending || updateTask.isPending;
    const isEdit = !!editTask;

    const handleSubmit = async () => {
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        try {
            const payload: CreateTaskInput = {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                assigned_to: assignedTo || null,
                incident_id: incidentId || null,
                due_date: dueDate ? new Date(dueDate).toISOString() : null,
            };

            if (isEdit) {
                await updateTask.mutateAsync({ id: editTask.id, ...payload, status });
                toast.success("Task updated");
            } else {
                await createTask.mutateAsync(payload);
                toast.success("Task created");
            }

            onOpenChange(false);
        } catch {
            toast.error(isEdit ? "Failed to update task" : "Failed to create task");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Task" : "Create Task"}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title"
                            data-selectable
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Task description..."
                            rows={3}
                            data-selectable
                        />
                    </div>

                    {/* Priority + Status row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="urgent">🔴 Urgent</SelectItem>
                                    <SelectItem value="high">🟠 High</SelectItem>
                                    <SelectItem value="medium">🟡 Medium</SelectItem>
                                    <SelectItem value="low">🟢 Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {isEdit && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium">Status</label>
                                <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Assignee + Incident */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Assign to</label>
                            <Select value={assignedTo || "__none__"} onValueChange={(v) => setAssignedTo(v === "__none__" ? "" : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Unassigned</SelectItem>
                                    {profiles.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.first_name} {p.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium">Linked Incident</label>
                            <Select value={incidentId || "__none__"} onValueChange={(v) => setIncidentId(v === "__none__" ? "" : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="None" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {incidents.map((inc) => (
                                        <SelectItem key={inc.id} value={inc.id}>
                                            {inc.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Due date */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Due Date</label>
                        <Input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            data-selectable
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEdit ? "Save Changes" : "Create Task"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Tasks Page ──────────────────────────────────────────────────

export default function TasksPage() {
    const userId = useAuthStore((s) => s.user?.id);
    const isAdmin = useAuthStore((s) => s.profile?.role === "administrator");
    const [view, setView] = useState<"kanban" | "list">("kanban");
    const [formOpen, setFormOpen] = useState(false);
    const [editTask, setEditTask] = useState<TaskWithProfiles | null>(null);
    const [filters, setFilters] = useState<TaskFilters>({});

    const { data: tasks = [], isLoading } = useTasks(filters);
    const updateTask = useUpdateTask();
    const deleteTask = useDeleteTask();
    const { data: profiles = [] } = useProfiles();

    const handleEdit = (task: TaskWithProfiles) => {
        setEditTask(task);
        setFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTask.mutateAsync(id);
            toast.success("Task deleted");
        } catch {
            toast.error("Failed to delete task");
        }
    };

    const handleStatusChange = async (id: string, status: TaskStatus) => {
        try {
            await updateTask.mutateAsync({ id, status });
            toast.success(`Task moved to ${status.replace("_", " ")}`);
        } catch {
            toast.error("Failed to update task");
        }
    };

    const myTasks = tasks.filter((t) => t.assigned_to === userId);
    const totalPending = tasks.filter((t) => t.status === "pending").length;
    const totalInProgress = tasks.filter((t) => t.status === "in_progress").length;

    return (
        <div className="flex flex-col h-full">
            {/* Page Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {tasks.length} tasks · {totalPending} pending · {totalInProgress} in
                        progress · {myTasks.length} assigned to you
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex items-center rounded-md border border-border">
                        <Button
                            variant={view === "kanban" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 rounded-r-none"
                            onClick={() => setView("kanban")}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === "list" ? "secondary" : "ghost"}
                            size="sm"
                            className="h-8 rounded-l-none"
                            onClick={() => setView("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button
                        onClick={() => {
                            setEditTask(null);
                            setFormOpen(true);
                        }}
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Task
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-muted/30">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tasks..."
                        className="pl-9 h-8"
                        value={filters.search ?? ""}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, search: e.target.value }))
                        }
                        data-selectable
                    />
                </div>
                <Select
                    value={filters.priority || "__all__"}
                    onValueChange={(v) => setFilters((f) => ({ ...f, priority: v === "__all__" ? "" : v as TaskPriority }))}
                >
                    <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={filters.assignedTo || "__all__"}
                    onValueChange={(v) => setFilters((f) => ({ ...f, assignedTo: v === "__all__" ? "" : v }))}
                >
                    <SelectTrigger className="w-40 h-8">
                        <SelectValue placeholder="Assignee" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="__all__">All Assignees</SelectItem>
                        {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                                {p.first_name} {p.last_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <ListTodo className="h-12 w-12 mb-3 opacity-40" />
                        <p className="text-lg font-medium">No tasks found</p>
                        <p className="text-sm mt-1">Create a task to start organizing work</p>
                        <Button
                            className="mt-4"
                            onClick={() => {
                                setEditTask(null);
                                setFormOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4 mr-1.5" />
                            Create Task
                        </Button>
                    </div>
                ) : view === "kanban" ? (
                    <KanbanBoard
                        tasks={tasks}
                        onEdit={handleEdit}
                        onDelete={isAdmin ? handleDelete : undefined}
                        onStatusChange={handleStatusChange}
                    />
                ) : (
                    /* List View */
                    <div className="space-y-2">
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={handleEdit}
                                onDelete={isAdmin ? handleDelete : undefined}
                                onStatusChange={handleStatusChange}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Task Form Dialog */}
            {formOpen && (
                <TaskFormDialog
                    open={formOpen}
                    onOpenChange={(open) => {
                        setFormOpen(open);
                        if (!open) setEditTask(null);
                    }}
                    editTask={editTask}
                />
            )}
        </div>
    );
}
