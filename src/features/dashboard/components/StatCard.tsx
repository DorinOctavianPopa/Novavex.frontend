import type { ReactNode } from "react";
import type { SvgIconComponent } from "@mui/icons-material";

import type { DashboardCardTone } from "@/features/dashboard/components/DashboardCard";

interface StatCardProps {
  readonly icon: SvgIconComponent;
  readonly tone?: DashboardCardTone;
  readonly label: ReactNode;
  readonly value: ReactNode;
  readonly helperText?: ReactNode;
}

// Material Dashboard 2-style "mini stat" card: gradient icon square, bold value,
// and a muted helper line underneath.
export function StatCard({
  icon: Icon,
  tone = "primary",
  label,
  value,
  helperText,
}: Readonly<StatCardProps>) {
  return (
    <div className="stat-card">
      <div className={`stat-card__icon stat-card__icon--${tone}`}>
        <Icon fontSize="medium" />
      </div>
      <div className="stat-card__body">
        <p className="stat-card__label">{label}</p>
        <p className="stat-card__value">{value}</p>
        {helperText ? (
          <p className="stat-card__helper">{helperText}</p>
        ) : null}
      </div>
    </div>
  );
}
