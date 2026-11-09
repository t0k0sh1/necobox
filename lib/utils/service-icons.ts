import {
  Activity,
  AtSign,
  type LucideIcon,
  Box,
  Brain,
  Cloud,
  CloudCog,
  Code2,
  GitBranch,
  Globe,
  HardDrive,
  MessageSquare,
  Monitor,
  PenTool,
  Rocket,
  Shield,
  Sparkles,
  Video,
  Zap,
  CreditCard,
} from "lucide-react";

// サービスID→lucide-reactアイコンのマッピング
// lucide-react 1.x でブランドアイコン(Figma / Twitter)が削除されたため、汎用アイコンで代用している
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
  figma: PenTool,
  stripe: CreditCard,
  x: AtSign,
};

export function getServiceIcon(serviceId: string): LucideIcon {
  return SERVICE_ICON_MAP[serviceId] || Globe;
}
