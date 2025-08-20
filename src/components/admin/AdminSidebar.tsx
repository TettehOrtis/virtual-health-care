import Link from 'next/link';
import { useRouter } from 'next/router';
import { LayoutDashboard, Stethoscope, Users, Building2, FileText, Bell, Settings } from 'lucide-react';

interface NavItem {
    href: string;
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { href: '/Admin/adminDashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { href: '/Admin/doctors', label: 'Doctors', icon: <Stethoscope className="w-4 h-4" /> },
    { href: '/Admin/patients', label: 'Patients', icon: <Users className="w-4 h-4" /> },
    { href: '/Admin/hospital', label: 'Hospitals', icon: <Building2 className="w-4 h-4" /> },
    { href: '/Admin/pharmacy', label: 'Partners', icon: <Building2 className="w-4 h-4" /> },
    { href: '/Admin/document', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
    { href: '/Admin/notification', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { href: '/Admin/settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

export default function AdminSidebar() {
    const router = useRouter();

    return (
        <aside className="w-64 shrink-0 border-r border-border bg-gradient-card h-full">
            <div className="p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Admin</p>
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const active = router.pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
                  ${active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted/40'}`}
                            >
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}


