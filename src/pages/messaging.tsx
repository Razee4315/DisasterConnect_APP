import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    useChannels,
    useMessages,
    useSendMessage,
    useCreateChannel,
    useChannelRealtime,
    type MessageWithSender,
} from "@/hooks/use-messages";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
    MessageSquare,
    Plus,
    Send,
    Search,
    Hash,
    Users,
    AlertTriangle,
    Radio,
    Loader2,
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import type { ChannelType } from "@/types/enums";

// ─── Channel Type Icons ──────────────────────────────────────────

const channelTypeIcon: Record<ChannelType, typeof Hash> = {
    incident: AlertTriangle,
    team: Users,
    direct: MessageSquare,
    broadcast: Radio,
};

// ─── Time Formatting ─────────────────────────────────────────────

function formatMsgTime(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return format(d, "h:mm a");
    if (isYesterday(d)) return `Yesterday ${format(d, "h:mm a")}`;
    return format(d, "MMM d, h:mm a");
}

// ─── Channel List ────────────────────────────────────────────────

function ChannelList({
    activeId,
    onSelect,
    onCreateNew,
}: {
    activeId?: string;
    onSelect: (id: string) => void;
    onCreateNew: () => void;
}) {
    const { data: channels = [], isLoading } = useChannels();
    const [search, setSearch] = useState("");

    const filtered = channels.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Group by type
    const grouped = filtered.reduce(
        (acc, ch) => {
            (acc[ch.type] ??= []).push(ch);
            return acc;
        },
        {} as Record<string, typeof filtered>
    );

    const typeLabels: Record<string, string> = {
        incident: "Incident Channels",
        team: "Team Channels",
        direct: "Direct Messages",
        broadcast: "Broadcasts",
    };

    return (
        <div className="flex flex-col h-full border-r border-border w-72 shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                <h3 className="text-sm font-semibold">Channels</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNew} aria-label="Create new channel">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            {/* Search */}
            <div className="p-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search channels..."
                        className="pl-8 h-7 text-xs"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        data-selectable
                    />
                </div>
            </div>

            {/* Channel List */}
            <ScrollArea className="flex-1">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p>No channels found</p>
                    </div>
                ) : (
                    Object.entries(grouped).map(([type, chs]) => (
                        <div key={type}>
                            <p className="text-[10px] font-semibold uppercase text-muted-foreground px-3 py-1.5 mt-2">
                                {typeLabels[type] ?? type}
                            </p>
                            {chs.map((ch) => {
                                const Icon = channelTypeIcon[ch.type] ?? Hash;
                                const isActive = ch.id === activeId;
                                return (
                                    <button
                                        key={ch.id}
                                        onClick={() => onSelect(ch.id)}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors ${isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                                            }`}
                                    >
                                        <Icon className="h-3.5 w-3.5 shrink-0" />
                                        <span className="flex-1 truncate">{ch.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))
                )}
            </ScrollArea>
        </div>
    );
}

// ─── Message Thread ──────────────────────────────────────────────

function MessageThread({
    channelId,
    channelName,
}: {
    channelId: string;
    channelName: string;
}) {
    const userId = useAuthStore((s) => s.user?.id);
    const { data: messages = [], isLoading } = useMessages(channelId);
    const sendMessage = useSendMessage();
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Subscribe to realtime
    useChannelRealtime(channelId);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages.length]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text) return;
        setInput("");
        try {
            await sendMessage.mutateAsync({ channelId, content: text });
        } catch {
            toast.error("Failed to send message");
            setInput(text);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col flex-1 min-w-0">
            {/* Thread Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">{channelName}</h3>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                    </div>
                ) : (
                    messages.map((msg: MessageWithSender) => {
                        const isOwn = msg.sender_id === userId;
                        const senderName = msg.sender
                            ? `${msg.sender.first_name} ${msg.sender.last_name}`
                            : "Unknown";
                        const initials = msg.sender
                            ? `${msg.sender.first_name[0]}${msg.sender.last_name[0]}`.toUpperCase()
                            : "?";

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}
                            >
                                <Avatar className="h-7 w-7 shrink-0">
                                    <AvatarFallback className="text-[10px] bg-muted">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-medium">{senderName}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatMsgTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <div
                                        className={`mt-0.5 rounded-lg px-3 py-1.5 text-sm inline-block ${isOwn
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 p-3 border-t border-border">
                <textarea
                    placeholder={`Message #${channelName}`}
                    className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    rows={1}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    data-selectable
                />
                <Button
                    size="icon"
                    className="shrink-0"
                    onClick={handleSend}
                    disabled={!input.trim() || sendMessage.isPending}
                    aria-label="Send message"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ─── Create Channel Dialog ───────────────────────────────────────

function CreateChannelDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelType>("team");
    const createChannel = useCreateChannel();

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Channel name is required");
            return;
        }

        try {
            await createChannel.mutateAsync({
                name: name.trim(),
                type,
            });
            toast.success("Channel created");
            onOpenChange(false);
            setName("");
        } catch (err: any) {
            console.error("[channels] Failed to create channel:", err);
            toast.error(err?.message || "Failed to create channel");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Channel Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. flood-response"
                            data-selectable
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={type} onValueChange={(v) => setType(v as ChannelType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="incident">Incident</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="direct">Direct</SelectItem>
                                <SelectItem value="broadcast">Broadcast</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={createChannel.isPending}>
                        {createChannel.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Messaging Page ──────────────────────────────────────────────

export default function MessagingPage() {
    const { channelId: urlChannelId } = useParams();
    const { data: channels = [] } = useChannels();
    const [activeChannelId, setActiveChannelId] = useState<string | undefined>(
        urlChannelId
    );
    const [createOpen, setCreateOpen] = useState(false);

    // Auto-select first channel if none
    useEffect(() => {
        if (!activeChannelId && channels.length > 0) {
            setActiveChannelId(channels[0].id);
        }
    }, [channels, activeChannelId]);

    const activeChannel = channels.find((c) => c.id === activeChannelId);

    return (
        <div className="flex h-full">
            <ChannelList
                activeId={activeChannelId}
                onSelect={setActiveChannelId}
                onCreateNew={() => setCreateOpen(true)}
            />

            {activeChannel ? (
                <MessageThread
                    channelId={activeChannel.id}
                    channelName={activeChannel.name}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mb-3 opacity-40" />
                    <p className="text-lg font-medium">Select a channel</p>
                    <p className="text-sm mt-1">
                        Pick a channel from the sidebar or create a new one
                    </p>
                    <Button className="mt-4" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create Channel
                    </Button>
                </div>
            )}

            <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
