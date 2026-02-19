import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
    useChannels,
    useMessages,
    useSendMessage,
    useCreateChannel,
    useJoinChannel,
    useChannelRealtime,
    useSearchMessages,
    type MessageWithSender,
} from "@/hooks/use-messages";
import { useAuthStore } from "@/stores/auth-store";
import { useProfiles } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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
    Paperclip,
    Image as ImageIcon,
    FileText,
    X,
    Download,
    ArrowDown,
    SearchX,
    File,
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

function formatDateSeparator(dateStr: string): string {
    const d = new Date(dateStr);
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "EEEE, MMMM d, yyyy");
}

// ─── File Type Helpers ───────────────────────────────────────────

function isImageFile(name: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(name);
}

function getFileIcon(name: string) {
    if (isImageFile(name)) return <ImageIcon className="h-4 w-4" />;
    if (/\.pdf$/i.test(name)) return <FileText className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── URL Detection ───────────────────────────────────────────────

function renderMessageContent(content: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);
    return parts.map((part, i) =>
        urlRegex.test(part) ? (
            <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
                onClick={(e) => e.stopPropagation()}
            >
                {part}
            </a>
        ) : (
            <span key={i}>{part}</span>
        )
    );
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

    const typeOrder = ["incident", "team", "direct", "broadcast"];

    return (
        <div className="flex flex-col h-full border-r border-border w-72 shrink-0 bg-card/50">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold">Messages</h3>
                </div>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateNew} aria-label="Create new channel">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>New Channel</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Search */}
            <div className="p-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search channels..."
                        className="pl-8 h-8 text-xs"
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
                    typeOrder
                        .filter((t) => grouped[t]?.length)
                        .map((type) => (
                            <div key={type}>
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-3 py-1.5 mt-2">
                                    {typeLabels[type] ?? type}
                                </p>
                                {grouped[type].map((ch) => {
                                    const Icon = channelTypeIcon[ch.type] ?? Hash;
                                    const isActive = ch.id === activeId;
                                    return (
                                        <button
                                            key={ch.id}
                                            onClick={() => onSelect(ch.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${isActive
                                                ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
                                                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
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

// ─── Attachment Preview (before sending) ─────────────────────────

function AttachmentPreview({
    file,
    onRemove,
}: {
    file: File;
    onRemove: () => void;
}) {
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-2 max-w-xs">
            {preview ? (
                <img src={preview} alt={file.name} className="h-10 w-10 rounded object-cover shrink-0" />
            ) : (
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    {getFileIcon(file.name)}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onRemove}>
                <X className="h-3 w-3" />
            </Button>
        </div>
    );
}

// ─── Message Attachment Display ──────────────────────────────────

function MessageAttachment({
    url,
    name,
}: {
    url: string;
    name: string;
}) {
    if (isImageFile(name)) {
        return (
            <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
                <img
                    src={url}
                    alt={name}
                    className="max-w-[280px] max-h-[200px] rounded-lg object-cover border border-border cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                />
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-1.5 rounded-lg border border-border bg-muted/50 p-2 max-w-[280px] hover:bg-muted transition-colors"
        >
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                {getFileIcon(name)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name}</p>
            </div>
            <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </a>
    );
}

// ─── Message Thread ──────────────────────────────────────────────

function MessageThread({
    channelId,
    channelName,
    channelType,
}: {
    channelId: string;
    channelName: string;
    channelType: string;
}) {
    const userId = useAuthStore((s) => s.user?.id);
    const { data: messages = [], isLoading } = useMessages(channelId);
    const sendMessage = useSendMessage();
    const joinChannel = useJoinChannel();
    const [input, setInput] = useState("");
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { data: searchResults = [] } = useSearchMessages(
        showSearch ? channelId : undefined,
        searchQuery
    );

    // Auto-join non-DM channels so user can send messages
    useEffect(() => {
        if (channelId && channelType !== "direct") {
            joinChannel.mutate(channelId);
        }
    }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Subscribe to realtime
    useChannelRealtime(channelId);

    // Auto-scroll on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages.length]);

    // Reset input when switching channels
    useEffect(() => {
        setInput("");
        setPendingFile(null);
        setShowSearch(false);
        setSearchQuery("");
    }, [channelId]);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    const handleScroll = useCallback(() => {
        if (!scrollRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    }, []);

    const handleSend = async () => {
        const text = input.trim();
        if (!text && !pendingFile) return;

        const fileToSend = pendingFile;
        setInput("");
        setPendingFile(null);

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
        }

        try {
            await sendMessage.mutateAsync({
                channelId,
                content: text,
                file: fileToSend ?? undefined,
            });
        } catch {
            toast.error("Failed to send message");
            setInput(text);
            if (fileToSend) setPendingFile(fileToSend);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                toast.error("File size must be under 50MB");
                return;
            }
            setPendingFile(file);
        }
        e.target.value = "";
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    setPendingFile(file);
                    return;
                }
            }
        }
    };

    // Group messages by date for separators
    const messagesWithSeparators: Array<
        { type: "separator"; date: string } | { type: "message"; msg: MessageWithSender }
    > = [];
    let lastDate = "";
    for (const msg of messages) {
        const msgDate = new Date(msg.created_at);
        const dateKey = format(msgDate, "yyyy-MM-dd");
        if (dateKey !== lastDate) {
            messagesWithSeparators.push({ type: "separator", date: msg.created_at });
            lastDate = dateKey;
        }
        messagesWithSeparators.push({ type: "message", msg });
    }

    const Icon = channelTypeIcon[channelType as ChannelType] ?? Hash;

    return (
        <div className="flex flex-col flex-1 min-w-0">
            {/* Thread Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">{channelName}</h3>
                    <Badge variant="outline" className="text-[10px] capitalize">{channelType}</Badge>
                </div>
                <div className="flex items-center gap-1">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant={showSearch ? "secondary" : "ghost"}
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        setShowSearch(!showSearch);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Search className="h-3.5 w-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Search Messages</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
                <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
                    <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <Input
                        placeholder="Search messages in this channel..."
                        className="h-7 text-xs border-0 bg-transparent focus-visible:ring-0 shadow-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                        data-selectable
                    />
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { setShowSearch(false); setSearchQuery(""); }}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            )}

            {/* Search Results */}
            {showSearch && searchQuery.length >= 2 && (
                <div className="border-b border-border bg-muted/20 max-h-[200px] overflow-y-auto">
                    {searchResults.length === 0 ? (
                        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                            <SearchX className="h-4 w-4" />
                            <span className="text-xs">No messages found</span>
                        </div>
                    ) : (
                        <div className="p-2 space-y-1">
                            <p className="text-[10px] text-muted-foreground px-2">{searchResults.length} result{searchResults.length !== 1 ? "s" : ""}</p>
                            {searchResults.map((msg) => (
                                <div key={msg.id} className="rounded-md p-2 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xs font-medium">
                                            {msg.sender ? `${msg.sender.first_name} ${msg.sender.last_name}` : "Unknown"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatMsgTime(msg.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{msg.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-1 scrollable relative"
                onScroll={handleScroll}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-3">
                            <MessageSquare className="h-8 w-8 opacity-40" />
                        </div>
                        <p className="text-sm font-medium text-foreground">No messages yet</p>
                        <p className="text-xs mt-1">Start the conversation!</p>
                    </div>
                ) : (
                    messagesWithSeparators.map((item, idx) => {
                        if (item.type === "separator") {
                            return (
                                <div key={`sep-${item.date}`} className="flex items-center gap-3 py-3">
                                    <div className="flex-1 h-px bg-border" />
                                    <span className="text-[10px] font-medium text-muted-foreground px-2">
                                        {formatDateSeparator(item.date)}
                                    </span>
                                    <div className="flex-1 h-px bg-border" />
                                </div>
                            );
                        }

                        const msg = item.msg;
                        const isOwn = msg.sender_id === userId;
                        const senderName = msg.sender
                            ? `${msg.sender.first_name} ${msg.sender.last_name}`
                            : "Unknown";
                        const initials = msg.sender
                            ? `${msg.sender.first_name[0]}${msg.sender.last_name[0]}`.toUpperCase()
                            : "?";

                        // Check if previous message is from same sender (for grouping)
                        const prevItem = messagesWithSeparators[idx - 1];
                        const showAvatar = !prevItem ||
                            prevItem.type === "separator" ||
                            (prevItem.type === "message" && prevItem.msg.sender_id !== msg.sender_id);

                        return (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2.5 ${isOwn ? "flex-row-reverse" : ""} ${showAvatar ? "mt-3" : "mt-0.5"}`}
                            >
                                {showAvatar ? (
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <div className="w-7 shrink-0" />
                                )}
                                <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                                    {showAvatar && (
                                        <div className={`flex items-baseline gap-2 mb-0.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                                            <span className="text-xs font-medium">{senderName}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatMsgTime(msg.created_at)}
                                            </span>
                                        </div>
                                    )}
                                    <div
                                        className={`rounded-2xl px-3 py-2 text-sm inline-block ${isOwn
                                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                                            : "bg-muted rounded-tl-sm"
                                            }`}
                                        data-selectable
                                    >
                                        {msg.content && (
                                            <p className="whitespace-pre-wrap break-words leading-relaxed">
                                                {renderMessageContent(msg.content)}
                                            </p>
                                        )}
                                    </div>
                                    {/* Attachment */}
                                    {msg.attachment_url && msg.attachment_name && (
                                        <MessageAttachment url={msg.attachment_url} name={msg.attachment_name} />
                                    )}
                                    {/* Timestamp for grouped messages */}
                                    {!showAvatar && (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="sr-only">{formatMsgTime(msg.created_at)}</span>
                                                </TooltipTrigger>
                                                <TooltipContent side={isOwn ? "left" : "right"}>
                                                    {formatMsgTime(msg.created_at)}
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Scroll to bottom button */}
                {showScrollBtn && (
                    <button
                        onClick={scrollToBottom}
                        className="sticky bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                    >
                        <ArrowDown className="h-3 w-3" />
                        New messages
                    </button>
                )}
            </div>

            {/* Attachment Preview */}
            {pendingFile && (
                <div className="px-3 pt-2">
                    <AttachmentPreview file={pendingFile} onRemove={() => setPendingFile(null)} />
                </div>
            )}

            {/* Input Area */}
            <div className="flex items-end gap-2 p-3 border-t border-border bg-card/50">
                <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar"
                />

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sendMessage.isPending}
                            >
                                <Paperclip className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach File</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 shrink-0"
                                onClick={() => {
                                    if (fileInputRef.current) {
                                        fileInputRef.current.accept = "image/*";
                                        fileInputRef.current.click();
                                        // Reset accept after click
                                        setTimeout(() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.accept = "image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar";
                                            }
                                        }, 100);
                                    }
                                }}
                                disabled={sendMessage.isPending}
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Send Image</TooltipContent>
                    </Tooltip>
                </TooltipProvider>

                <textarea
                    ref={textareaRef}
                    placeholder={`Message #${channelName}...`}
                    className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[36px] max-h-[150px]"
                    rows={1}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                    }}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    data-selectable
                />

                <Button
                    size="icon"
                    className="shrink-0 h-9 w-9 rounded-full"
                    onClick={handleSend}
                    disabled={(!input.trim() && !pendingFile) || sendMessage.isPending}
                    aria-label="Send message"
                >
                    {sendMessage.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
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
    const userId = useAuthStore((s) => s.user?.id);
    const [name, setName] = useState("");
    const [type, setType] = useState<ChannelType>("team");
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const createChannel = useCreateChannel();
    const { data: allProfiles = [] } = useProfiles();

    // Profiles excluding current user
    const otherProfiles = allProfiles.filter((p) => p.id !== userId);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error("Channel name is required");
            return;
        }

        if (type === "direct" && selectedMembers.length === 0) {
            toast.error("Select at least one member for a direct message");
            return;
        }

        try {
            await createChannel.mutateAsync({
                name: name.trim(),
                type,
                member_ids: selectedMembers,
            });
            toast.success("Channel created");
            onOpenChange(false);
            setName("");
            setSelectedMembers([]);
        } catch (err: any) {
            console.error("[channels] Failed to create channel:", err);
            toast.error(err?.message || "Failed to create channel");
        }
    };

    const toggleMember = (id: string) => {
        setSelectedMembers((prev) =>
            prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Create Channel</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Type</label>
                        <Select value={type} onValueChange={(v) => {
                            setType(v as ChannelType);
                            setSelectedMembers([]);
                        }}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="incident">Incident</SelectItem>
                                <SelectItem value="team">Team</SelectItem>
                                <SelectItem value="direct">Direct Message</SelectItem>
                                <SelectItem value="broadcast">Broadcast</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">Channel Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === "direct" ? "e.g. Chat with Ali" : "e.g. flood-response"}
                            data-selectable
                        />
                    </div>

                    {/* Member picker */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium">
                            {type === "direct" ? "Select Member" : "Add Members (optional)"}
                        </label>
                        <div className="max-h-40 overflow-y-auto rounded-md border border-input">
                            {otherProfiles.length === 0 ? (
                                <p className="text-xs text-muted-foreground p-3 text-center">No other users found</p>
                            ) : (
                                otherProfiles.map((p) => {
                                    const isSelected = selectedMembers.includes(p.id);
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => toggleMember(p.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/10 text-primary" : ""}`}
                                        >
                                            <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-primary border-primary" : "border-input"}`}>
                                                {isSelected && <span className="text-[10px] text-primary-foreground">✓</span>}
                                            </div>
                                            <span className="truncate">{p.first_name} {p.last_name}</span>
                                            <span className="text-xs text-muted-foreground ml-auto">{p.role}</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        {selectedMembers.length > 0 && (
                            <p className="text-xs text-muted-foreground">{selectedMembers.length} member{selectedMembers.length > 1 ? "s" : ""} selected</p>
                        )}
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
                    key={activeChannel.id}
                    channelId={activeChannel.id}
                    channelName={activeChannel.name}
                    channelType={activeChannel.type}
                />
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                    <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="h-10 w-10 opacity-40" />
                    </div>
                    <p className="text-lg font-medium text-foreground">Select a channel</p>
                    <p className="text-sm mt-1">
                        Pick a channel from the sidebar or create a new one
                    </p>
                    <Button className="mt-4 gap-1.5" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-4 w-4" />
                        Create Channel
                    </Button>
                </div>
            )}

            <CreateChannelDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}
