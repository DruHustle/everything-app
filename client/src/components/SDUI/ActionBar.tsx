import React from "react";
import { LayoutAction } from "@shared/sdui.types";
import { Button } from "@/components/ui/button";

interface ActionBarProps {
  actions: LayoutAction[];
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ actions, onAction }) => {
  return (
    <div className="fixed bottom-6 right-6 flex gap-2 flex-col items-end">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.type === "primary" ? "default" : "outline"}
          onClick={() => onAction?.(action.id, action.payload)}
          className="shadow-lg"
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
};

export default ActionBar;
