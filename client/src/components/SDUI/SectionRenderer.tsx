import React from "react";
import { LayoutSection, SectionType } from "@shared/sdui.types";
import { CardGrid } from "./sections/CardGrid";
import { ListSection } from "./sections/ListSection";
import { TimelineSection } from "./sections/TimelineSection";
import { CalendarSection } from "./sections/CalendarSection";
import { MapSection } from "./sections/MapSection";
import { AlertsSection } from "./sections/AlertsSection";
import { RecommendationsSection } from "./sections/RecommendationsSection";
import { HeroSection } from "./sections/HeroSection";
import { HeaderSection } from "./sections/HeaderSection";

interface SectionRendererProps {
  section: LayoutSection;
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
  data?: Record<string, unknown>;
}

/**
 * Renders individual layout sections based on type
 */
export const SectionRenderer: React.FC<SectionRendererProps> = ({
  section,
  onAction,
  data,
}) => {
  const renderSectionByType = (type: SectionType) => {
    switch (type) {
      case "header":
        return (
          <HeaderSection
            title={section.title}
            items={[]}
            onAction={onAction}
          />
        );

      case "hero":
        return (
          <HeroSection
            title={section.title}
            items={section.content?.items || []}
            onAction={onAction}
          />
        );

      case "cards":
        return (
          <CardGrid
            items={section.content?.items || []}
            columns={section.columns || 3}
            spacing={section.spacing || "normal"}
            onAction={onAction}
          />
        );

      case "list":
        return (
          <ListSection
            items={section.content?.items || []}
            spacing={section.spacing || "normal"}
            onAction={onAction}
          />
        );

      case "timeline":
        return (
          <TimelineSection
            items={section.content?.items || []}
            onAction={onAction}
          />
        );

      case "calendar":
        return (
          <CalendarSection
            title={section.title}
            data={data}
            onAction={onAction}
          />
        );

      case "map":
        return (
          <MapSection
            title={section.title}
            data={data}
            onAction={onAction}
          />
        );

      case "alerts":
        return (
          <AlertsSection
            items={section.content?.items || []}
            onAction={onAction}
          />
        );

      case "recommendations":
        return (
          <RecommendationsSection
            items={section.content?.items || []}
            onAction={onAction}
          />
        );

      default:
        return (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-muted-foreground">
              Unknown section type: {type}
            </p>
          </div>
        );
    }
  };

  const containerClass =
    section.spacing === "compact"
      ? "py-2"
      : section.spacing === "spacious"
        ? "py-12"
        : "py-6";

  return (
    <section
      id={section.id}
      className={`${containerClass} ${section.layout === "map" ? "" : "container mx-auto px-4"}`}
    >
      {section.title && section.type !== "header" && section.type !== "hero" && (
        <h2 className="text-3xl font-bold mb-6">{section.title}</h2>
      )}

      {renderSectionByType(section.type)}

      {section.children && section.children.length > 0 && (
        <div className="mt-6 space-y-6">
          {section.children.map((child) => (
            <SectionRenderer
              key={child.id}
              section={child}
              onAction={onAction}
              data={data}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default SectionRenderer;
