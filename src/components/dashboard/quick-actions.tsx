import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Package,
  Radio,
  ListTodo,
  Map,
} from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        <Button
          variant="default"
          className="w-full justify-start gap-2"
          onClick={() => navigate("/incidents")}
        >
          <AlertTriangle className="h-4 w-4" />
          Report Incident
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => navigate("/resources")}
        >
          <Package className="h-4 w-4" />
          Add Resource
        </Button>
        <Button
          variant="destructive"
          className="w-full justify-start gap-2"
          onClick={() => {
            // SOS is handled by the topbar button globally
            // Navigate to alerts as a fallback
            navigate("/alerts");
          }}
        >
          <Radio className="h-4 w-4" />
          Send SOS
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => navigate("/tasks")}
        >
          <ListTodo className="h-4 w-4" />
          Create Task
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => navigate("/map")}
        >
          <Map className="h-4 w-4" />
          View Full Map
        </Button>
      </CardContent>
    </Card>
  );
}
