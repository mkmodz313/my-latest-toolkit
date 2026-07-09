export interface ToolItem {
  id: string;
  name: string;
  link: string;
  img: string;
  category: "Aim Mods" | "Sensors" | "Bypass" | "Security";
  status: "ACTIVE" | "OFFLINE" | "BETA";
  description: string;
  details?: string[];
}
