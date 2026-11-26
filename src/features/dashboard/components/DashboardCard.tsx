import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";

export type DashboardCardTone = "primary" | "success" | "warning" | "info";

interface DashboardCardProps {
  readonly icon: SvgIconComponent;
  readonly tone?: DashboardCardTone;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly actions?: ReactNode;
  readonly fullWidth?: boolean;
  readonly children?: ReactNode;
}

// Material Dashboard 2-style card: a colored icon "chip" floats above the top-left
// corner of a soft, blurred panel, with the title/description/body stacked below it.
export function DashboardCard({
  icon: Icon,
  tone = "primary",
  title,
  description,
  actions,
  fullWidth,
  children,
}: Readonly<DashboardCardProps>) {
  return (
    <article
      className={`dashboard-card${fullWidth ? " dashboard-card--full" : ""}`}
    >
      <div className={`dashboard-card__icon dashboard-card__icon--${tone}`}>
        <Icon fontSize="small" />
      </div>
      <div className="dashboard-card__header">
        <h2>{title}</h2>
        {actions}
      </div>
      {description ? (
        <p className="dashboard-card__description">{description}</p>
      ) : null}
      {children ? <div className="dashboard-card__body">{children}</div> : null}
    </article>
  );
}
