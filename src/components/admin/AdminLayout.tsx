import { ReactNode } from 'react';
import MainLayout from '@/components/layout/mainlayout';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <MainLayout>
            <div className="container mx-auto px-4 py-6 bg-gray-50">
                <div className="flex gap-6 min-h-[70vh]">
                    <AdminSidebar />
                    <section className="flex-1">{children}</section>
                </div>
            </div>
        </MainLayout>
    );
}


