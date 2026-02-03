import React from "react";
import { ContentItem } from "@shared/sdui.types";

interface SectionProps {
  title?: string;
  items?: ContentItem[];
  data?: Record<string, unknown>;
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
}

export const RecommendationsSection: React.FC<SectionProps> = ({ title, items, data, onAction }) => {
  return (
    <div className="p-4 bg-muted/50 rounded-lg border border-border">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      <p className="text-sm text-muted-foreground">RecommendationsSection placeholder</p>
    </div>
  );
};
