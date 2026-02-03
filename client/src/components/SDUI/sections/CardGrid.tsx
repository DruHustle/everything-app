import React from "react";
import { ContentItem, ContentAction } from "@shared/sdui.types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CardGridProps {
  items: ContentItem[];
  columns?: number;
  spacing?: "compact" | "normal" | "spacious";
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}

export const CardGrid: React.FC<CardGridProps> = ({
  items,
  columns = 3,
  spacing = "normal",
  onAction,
}) => {
  const gridClass = `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns} gap-${spacing === "compact" ? "2" : spacing === "spacious" ? "8" : "4"}`;

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <Card key={item.id} className="hover:shadow-lg transition-shadow">
          {item.image && (
            <div className="h-48 bg-muted overflow-hidden rounded-t-lg">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <CardTitle>{item.title}</CardTitle>
                {item.subtitle && (
                  <CardDescription>{item.subtitle}</CardDescription>
                )}
              </div>
              {item.badge && (
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full whitespace-nowrap">
                  {item.badge}
                </span>
              )}
            </div>
          </CardHeader>
          {item.description && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          )}
          {item.actions && item.actions.length > 0 && (
            <CardContent className="pt-0">
              <div className="flex gap-2">
                {item.actions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.type === "primary" ? "default" : action.type === "tertiary" ? "ghost" : action.type}
                    size="sm"
                    onClick={() => onAction?.(action.id, action.payload)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default CardGrid;
