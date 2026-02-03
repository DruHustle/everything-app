import React from "react";
import { ContentItem } from "@shared/sdui.types";
import { Button } from "@/components/ui/button";

interface ListSectionProps {
  items: ContentItem[];
  spacing?: "compact" | "normal" | "spacious";
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}

export const ListSection: React.FC<ListSectionProps> = ({
  items,
  spacing = "normal",
  onAction,
}) => {
  const spacingClass = spacing === "compact" ? "py-2" : spacing === "spacious" ? "py-4" : "py-3";

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className={`p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors ${spacingClass}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold">{item.title}</h3>
              {item.subtitle && <p className="text-sm text-muted-foreground">{item.subtitle}</p>}
              {item.description && <p className="text-sm mt-1">{item.description}</p>}
            </div>
            {item.badge && (
              <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {item.badge}
              </span>
            )}
          </div>
          {item.actions && item.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {item.actions.map((action) => (
                <Button
                  key={action.id}
                  variant="outline"
                  size="sm"
                  onClick={() => onAction?.(action.id, action.payload)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
