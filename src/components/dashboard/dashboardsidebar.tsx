import Link from "next/link";
import { useRouter } from "next/router";
import { LucideIcon } from "lucide-react";

interface SidebarItem {
  href: string;
  icon: LucideIcon;
  title: string;
}

interface DashboardSidebarProps {
  items: SidebarItem[];
  className?: string;
}

const DashboardSidebar = ({ items }: DashboardSidebarProps) => {
  const router = useRouter();

  return (
    <div className="w-64 bg-white border-r h-full">
      <div className="p-6">
        <nav className="space-y-2">
          {items.map((item) => {
            const isActive = router.pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
                  }`}
              >
                <Icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardSidebar;
