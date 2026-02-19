import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Package,
  Radio,
  ListTodo,
  Map,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface ActionItemProps {
  icon: LucideIcon;
  label: string;
  description: string;
  variant?: "default" | "outline" | "destructive";
  iconBg: string;
  onClick: () => void;
}

function ActionItem({
  icon: Icon,
  label,
  description,
  variant = "outline",
  iconBg,
  onClick,
}: ActionItemProps) {
  return (
    <Button
      variant={variant}
      className="w-full h-auto justify-start gap-3 py-2.5 px-3"
      onClick={onClick}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex flex-col items-start text-left">
        <span className="text-sm font-medium leading-tight">{label}</span>
        <span className="text-[11px] opacity-70 font-normal leading-tight">{description}</span>
      </div>
      <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-40" />
    </Button>
  );
}

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <ActionItem
          icon={AlertTriangle}
          label="Report Incident"
          description="Log a new emergency"
          variant="default"
          iconBg="bg-white/20"
          onClick={() => navigate("/incidents")}
        />
        <ActionItem
          icon={Package}
          label="Add Resource"
          description="Register equipment or supply"
          iconBg="bg-emerald-500/10"
          onClick={() => navigate("/resources")}
        />
        <ActionItem
          icon={Radio}
          label="Send SOS"
          description="Broadcast urgent alert"
          variant="destructive"
          iconBg="bg-white/20"
          onClick={() => navigate("/alerts")}
        />
        <ActionItem
          icon={ListTodo}
          label="Create Task"
          description="Assign work to team"
          iconBg="bg-primary/10"
          onClick={() => navigate("/tasks")}
        />
        <ActionItem
          icon={Map}
          label="View Full Map"
          description="See all incidents & resources"
          iconBg="bg-blue-500/10"
          onClick={() => navigate("/map")}
        />
      </CardContent>
    </Card>
  );
}
