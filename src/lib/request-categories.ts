import { HandHeart, Leaf, Users, HeartPulse, BookOpen, UtensilsCrossed, type LucideIcon } from "lucide-react";

export type RequestCategoryKey =
  | "helping_hands"
  | "environment"
  | "empowering_groups"
  | "health"
  | "education"
  | "food_shelter";

export interface RequestCategory {
  key: RequestCategoryKey;
  label: string;
  icon: LucideIcon;
  blurb: string;
  detailsLabel: string;
  detailsPlaceholder: string;
  /** tailwind gradient classes for the card background */
  gradient: string;
  /** tailwind text color for icon */
  iconColor: string;
}

export const REQUEST_CATEGORIES: RequestCategory[] = [
  {
    key: "helping_hands",
    label: "Helping Hands",
    icon: HandHeart,
    blurb: "General community help",
    detailsLabel: "Describe how the community can help",
    detailsPlaceholder: "Tell us what kind of support you need…",
    gradient: "from-rose-500/15 to-pink-500/10",
    iconColor: "text-rose-600",
  },
  {
    key: "environment",
    label: "Environmentalism",
    icon: Leaf,
    blurb: "Nature & eco issues",
    detailsLabel: "Describe the environmental issue",
    detailsPlaceholder: "e.g. illegal dumping, deforestation, pollution…",
    gradient: "from-emerald-500/15 to-green-500/10",
    iconColor: "text-emerald-600",
  },
  {
    key: "empowering_groups",
    label: "Empowering Groups",
    icon: Users,
    blurb: "Women, minorities, communities",
    detailsLabel: "Describe the group and the support needed",
    detailsPlaceholder: "Who needs empowerment and how?",
    gradient: "from-violet-500/15 to-fuchsia-500/10",
    iconColor: "text-violet-600",
  },
  {
    key: "health",
    label: "Health",
    icon: HeartPulse,
    blurb: "Medical emergencies, disabilities",
    detailsLabel: "Describe the medical situation",
    detailsPlaceholder: "Patient condition, urgency, what's needed…",
    gradient: "from-sky-500/15 to-blue-500/10",
    iconColor: "text-sky-600",
  },
  {
    key: "education",
    label: "Education",
    icon: BookOpen,
    blurb: "Scholarships, school supplies",
    detailsLabel: "Describe the education need",
    detailsPlaceholder: "Grade, school, books / fees / supplies needed…",
    gradient: "from-amber-500/15 to-orange-500/10",
    iconColor: "text-amber-600",
  },
  {
    key: "food_shelter",
    label: "Food & Shelter",
    icon: UtensilsCrossed,
    blurb: "Hunger, homelessness",
    detailsLabel: "Describe the food or shelter need",
    detailsPlaceholder: "How many people, location, immediate needs…",
    gradient: "from-orange-500/15 to-red-500/10",
    iconColor: "text-orange-600",
  },
];

export const URGENCY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground border-border" },
  { value: "medium", label: "Medium", color: "bg-info/20 text-foreground border-info/40" },
  { value: "high", label: "High", color: "bg-amber/20 text-amber-foreground border-amber/40" },
  { value: "critical", label: "Critical", color: "bg-destructive/20 text-destructive border-destructive/40" },
] as const;

export function getCategory(key: string | null | undefined): RequestCategory | undefined {
  return REQUEST_CATEGORIES.find((c) => c.key === key);
}
