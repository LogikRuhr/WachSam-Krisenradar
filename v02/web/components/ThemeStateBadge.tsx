import { THEME_STATE_LABEL, type ThemeState } from "@/lib/themes";

export function ThemeStateBadge({ state }: { state: ThemeState }) {
  return <span className={`theme-state-badge theme-state-${state}`}>{THEME_STATE_LABEL[state]}</span>;
}
