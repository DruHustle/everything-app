/**
 * Server-Driven UI (SDUI) Types
 * Defines the structure for dynamic layout configuration and rendering
 */

export type LayoutMode = "calendar" | "guide" | "itinerary" | "booking";

export interface LayoutConfig {
  mode: LayoutMode;
  title: string;
  description?: string;
  sections: LayoutSection[];
  actions?: LayoutAction[];
  metadata?: Record<string, unknown>;
}

export interface LayoutSection {
  id: string;
  type: SectionType;
  title?: string;
  subtitle?: string;
  content?: SectionContent;
  layout?: "grid" | "list" | "carousel" | "timeline" | "map";
  columns?: number;
  spacing?: "compact" | "normal" | "spacious";
  visibility?: VisibilityRule;
  children?: LayoutSection[];
}

export type SectionType =
  | "header"
  | "hero"
  | "cards"
  | "list"
  | "timeline"
  | "calendar"
  | "map"
  | "form"
  | "gallery"
  | "stats"
  | "alerts"
  | "recommendations"
  | "footer";

export interface SectionContent {
  items?: ContentItem[];
  template?: string;
  dataSource?: DataSource;
}

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string;
  icon?: string;
  badge?: string;
  metadata?: Record<string, unknown>;
  actions?: ContentAction[];
}

export interface ContentAction {
  id: string;
  label: string;
  type: "primary" | "secondary" | "tertiary" | "destructive";
  action: string;
  payload?: Record<string, unknown>;
  condition?: string;
}

export interface LayoutAction {
  id: string;
  label: string;
  icon?: string;
  type: "primary" | "secondary" | "tertiary";
  action: string;
  payload?: Record<string, unknown>;
  position?: "top" | "bottom" | "floating";
}

export interface DataSource {
  type: "api" | "local" | "computed";
  endpoint?: string;
  method?: "GET" | "POST";
  params?: Record<string, unknown>;
  transform?: string;
  cache?: {
    ttl: number;
    key: string;
  };
}

export interface VisibilityRule {
  condition: "always" | "authenticated" | "anonymous" | "custom";
  customRule?: string;
}

/**
 * Calendar Mode Configuration
 */
export interface CalendarModeConfig extends LayoutConfig {
  mode: "calendar";
  calendarSettings?: {
    view: "month" | "week" | "day";
    startDate: Date;
    endDate: Date;
    highlightDates?: Date[];
    eventTypes?: string[];
  };
}

/**
 * Travel Guide Mode Configuration
 */
export interface GuideModeConfig extends LayoutConfig {
  mode: "guide";
  guideSettings?: {
    destination: string;
    interests?: string[];
    budget?: "budget" | "moderate" | "luxury";
    duration?: number;
    filters?: Record<string, unknown>;
  };
}

/**
 * Itinerary Mode Configuration
 */
export interface ItineraryModeConfig extends LayoutConfig {
  mode: "itinerary";
  itinerarySettings?: {
    tripId: number;
    startDate: Date;
    endDate: Date;
    showWeather: boolean;
    showAlerts: boolean;
    showRecommendations: boolean;
    groupBy?: "date" | "category" | "location";
  };
}

/**
 * Booking Mode Configuration
 */
export interface BookingModeConfig extends LayoutConfig {
  mode: "booking";
  bookingSettings?: {
    bookingType: "flight" | "hotel" | "car" | "activity";
    searchFilters?: Record<string, unknown>;
    sortBy?: "price" | "rating" | "relevance";
    showDiscounts: boolean;
  };
}

/**
 * SDUI Response Structure
 */
export interface SDUIResponse {
  config: LayoutConfig;
  data?: Record<string, unknown>;
  errors?: SDUIError[];
  metadata?: {
    version: string;
    timestamp: Date;
    cacheKey?: string;
    ttl?: number;
  };
}

export interface SDUIError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

/**
 * Layout Builder Helper Types
 */
export interface LayoutBuilder {
  mode: LayoutMode;
  sections: LayoutSection[];
  addSection(section: LayoutSection): LayoutBuilder;
  addAction(action: LayoutAction): LayoutBuilder;
  build(): LayoutConfig;
}
