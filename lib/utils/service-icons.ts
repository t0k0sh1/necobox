import {
  Activity,
  type LucideIcon,
  Box,
  Brain,
  Cloud,
  CloudCog,
  Code2,
  Figma,
  GitBranch,
  Globe,
  HardDrive,
  MessageSquare,
  Monitor,
  Rocket,
  Shield,
  Sparkles,
  Video,
  Zap,
  CreditCard,
} from "lucide-react";

// サービスID→lucide-reactアイコンのマッピング
const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  aws: Cloud,
  azure: CloudCog,
  gcp: Globe,
  box: Box,
  dropbox: HardDrive,
  github: GitBranch,
  circleci: Activity,
  jira: Code2,
  slack: MessageSquare,
  zoom: Video,
  discord: MessageSquare,
  notion: Monitor,
  vercel: Rocket,
  netlify: Zap,
  cloudflare: Shield,
  openai: Brain,
  anthropic: Sparkles,
  figma: Figma,
  stripe: CreditCard,
};

export function getServiceIcon(serviceId: string): LucideIcon {
  return SERVICE_ICON_MAP[serviceId] || Globe;
}
