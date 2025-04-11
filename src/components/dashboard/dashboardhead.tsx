import { ReactNode } from "react";

interface DashboardCardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

const DashboardCardHeader = ({
  title,
  description,
  action,
}: DashboardCardHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <div className="text-xl font-semibold text-gray-900">{title}</div>
        {description && (
          <div className="text-sm text-gray-600">{description}</div>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export default DashboardCardHeader;
