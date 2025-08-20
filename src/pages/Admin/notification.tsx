import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AdminNotification {
    id: string;
    title: string;
    message: string;
    type: 'APPOINTMENT' | 'PRESCRIPTION' | 'MESSAGE' | 'SYSTEM';
    read: boolean;
    createdAt: string;
    user: { name: string; email: string };
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');
                const res = await fetch('/api/admin/notifications', {
                    headers: { Authorization: token ? `Bearer ${token}` : '' }
                });
                if (!res.ok) throw new Error('Failed to load notifications');
                const data = await res.json();
                setNotifications(data.notifications);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <h2 className="text-3xl font-bold text-foreground">Notifications</h2>
                {loading ? (
                    <div className="text-muted-foreground">Loading...</div>
                ) : (
                    <div className="bg-gradient-card border border-border rounded-xl shadow-card overflow-hidden">
                        <div className="divide-y divide-border">
                            {notifications.map((n) => (
                                <div key={n.id} className="p-4 flex items-start justify-between">
                                    <div>
                                        <p className="text-foreground font-semibold">{n.title}</p>
                                        <p className="text-sm text-muted-foreground">{n.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{n.type} • {n.user.name} ({n.user.email})</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${n.read ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                                        {n.read ? 'Read' : 'Unread'}
                                    </span>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <div className="p-4 text-muted-foreground">No notifications yet.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


