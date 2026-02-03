import React from "react";
import { LayoutConfig, LayoutSection } from "@shared/sdui.types";
import { SectionRenderer } from "./SectionRenderer";
import { ActionBar } from "./ActionBar";

interface LayoutRendererProps {
  config: LayoutConfig;
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
  data?: Record<string, unknown>;
  loading?: boolean;
  error?: string;
}

/**
 * Main SDUI Layout Renderer Component
 * Dynamically renders layouts based on server-provided configuration
 */
export const LayoutRenderer: React.FC<LayoutRendererProps> = ({
  config,
  onAction,
  data,
  loading,
  error,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-destructive/10">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Render sections */}
      <div className="space-y-0">
        {config.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            onAction={onAction}
            data={data}
          />
        ))}
      </div>

      {/* Render floating actions */}
      {config.actions && config.actions.length > 0 && (
        <ActionBar
          actions={config.actions.filter((a) => a.position === "floating")}
          onAction={onAction}
        />
      )}
    </div>
  );
};

export default LayoutRenderer;
