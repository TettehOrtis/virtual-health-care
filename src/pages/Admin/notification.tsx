import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Bell,
    Search,
    Filter,
    Send,
    Plus,
    Eye,
    EyeOff,
    Trash2,
    Calendar,
    User,
    MessageSquare,
    AlertTriangle,
    CheckCircle,
    Clock,
    Mail
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminNotification {
    id: string;
    title: string;
    message: string;
    type: 'APPOINTMENT' | 'PRESCRIPTION' | 'MESSAGE' | 'SYSTEM' | 'ANNOUNCEMENT';
    read: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
    user: { name: string; email: string };
    targetAudience?: 'ALL' | 'DOCTORS' | 'PATIENTS' | 'ADMINS';
}

export default function AdminNotifications() {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [search, setSearch] = useState<string>('');
    const [filter, setFilter] = useState<string>('all');
    const [showComposeForm, setShowComposeForm] = useState<boolean>(false);
    const [newNotification, setNewNotification] = useState({
        title: '',
        message: '',
        type: 'ANNOUNCEMENT',
        priority: 'MEDIUM',
        targetAudience: 'ALL'
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/admin/notifications', {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (!res.ok) throw new Error('Failed to load notifications');
            const data = await res.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load notifications');
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'APPOINTMENT':
                return <Calendar className="w-4 h-4" />;
            case 'PRESCRIPTION':
                return <CheckCircle className="w-4 h-4" />;
            case 'MESSAGE':
                return <MessageSquare className="w-4 h-4" />;
            case 'SYSTEM':
                return <AlertTriangle className="w-4 h-4" />;
            case 'ANNOUNCEMENT':
                return <Bell className="w-4 h-4" />;
            default:
                return <Bell className="w-4 h-4" />;
        }
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'APPOINTMENT':
                return <Badge className="bg-blue-100 text-blue-800">Appointment</Badge>;
            case 'PRESCRIPTION':
                return <Badge className="bg-green-100 text-green-800">Prescription</Badge>;
            case 'MESSAGE':
                return <Badge className="bg-purple-100 text-purple-800">Message</Badge>;
            case 'SYSTEM':
                return <Badge className="bg-orange-100 text-orange-800">System</Badge>;
            case 'ANNOUNCEMENT':
                return <Badge className="bg-yellow-100 text-yellow-800">Announcement</Badge>;
            default:
                return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
            case 'HIGH':
                return <Badge className="bg-orange-100 text-orange-800">High</Badge>;
            case 'MEDIUM':
                return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
            case 'LOW':
                return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
            default:
                return <Badge variant="secondary">{priority}</Badge>;
        }
    };

    const filteredNotifications = notifications.filter((notification) => {
        const matchesSearch = [notification.title, notification.message, notification.user.name].some((v) =>
            v.toLowerCase().includes(search.toLowerCase())
        );
        const matchesFilter = filter === 'all' || notification.type === filter;
        return matchesSearch && matchesFilter;
    });

    const handleSendNotification = async () => {
        if (!newNotification.title || !newNotification.message) {
            toast.error('Please fill in all required fields');
            return;
        }

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(newNotification)
            });

            if (res.ok) {
                toast.success('Notification sent successfully');
                setNewNotification({ title: '', message: '', type: 'ANNOUNCEMENT', priority: 'MEDIUM', targetAudience: 'ALL' });
                setShowComposeForm(false);
                fetchNotifications();
            } else {
                toast.error('Failed to send notification');
            }
        } catch (err) {
            console.error('Failed to send notification:', err);
            toast.error('Failed to send notification');
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`/api/admin/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });

            if (res.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === notificationId ? { ...n, read: true } : n
                ));
            }
        } catch (err) {
            console.error('Failed to mark as read:', err);
        }
    };

    const handleDeleteNotification = async (notificationId: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;

        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch(`/api/admin/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });

            if (res.ok) {
                toast.success('Notification deleted successfully');
                setNotifications(prev => prev.filter(n => n.id !== notificationId));
            } else {
                toast.error('Failed to delete notification');
            }
        } catch (err) {
            console.error('Failed to delete notification:', err);
            toast.error('Failed to delete notification');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">Notification Management</h2>
                    <div className="text-gray-600">Loading notifications...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Notification Management</h2>
                        <p className="text-gray-600">Manage system notifications and announcements</p>
                    </div>
                    <Button
                        onClick={() => setShowComposeForm(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Send Notification
                    </Button>
                </div>

                {/* Compose Form */}
                {showComposeForm && (
                    <Card className="bg-white border border-gray-200 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-gray-900">Compose Notification</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                                    <Input
                                        value={newNotification.title}
                                        onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                                        className="bg-white border border-gray-300 text-gray-900"
                                        placeholder="Enter notification title"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={newNotification.type}
                                        onChange={(e) => setNewNotification(prev => ({ ...prev, type: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                                    >
                                        <option value="ANNOUNCEMENT">Announcement</option>
                                        <option value="SYSTEM">System</option>
                                        <option value="APPOINTMENT">Appointment</option>
                                        <option value="PRESCRIPTION">Prescription</option>
                                        <option value="MESSAGE">Message</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                    <select
                                        value={newNotification.priority}
                                        onChange={(e) => setNewNotification(prev => ({ ...prev, priority: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                                    <select
                                        value={newNotification.targetAudience}
                                        onChange={(e) => setNewNotification(prev => ({ ...prev, targetAudience: e.target.value }))}
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                                    >
                                        <option value="ALL">All Users</option>
                                        <option value="DOCTORS">Doctors Only</option>
                                        <option value="PATIENTS">Patients Only</option>
                                        <option value="ADMINS">Admins Only</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                                <Textarea
                                    value={newNotification.message}
                                    onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                                    className="bg-white border border-gray-300 text-gray-900"
                                    placeholder="Enter notification message"
                                    rows={4}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleSendNotification} className="bg-blue-600 hover:bg-blue-700 text-white">
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Notification
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setShowComposeForm(false);
                                        setNewNotification({ title: '', message: '', type: 'ANNOUNCEMENT', priority: 'MEDIUM', targetAudience: 'ALL' });
                                    }}
                                    className="border-gray-300 text-gray-700"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Search and Filter */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search notifications..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 bg-white border border-gray-300 text-gray-900"
                            />
                        </div>
                        <div className="flex space-x-2">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                            >
                                <option value="all">All Types</option>
                                <option value="ANNOUNCEMENT">Announcements</option>
                                <option value="SYSTEM">System</option>
                                <option value="APPOINTMENT">Appointments</option>
                                <option value="PRESCRIPTION">Prescriptions</option>
                                <option value="MESSAGE">Messages</option>
                            </select>
                            <Button variant="outline" className="border-gray-300 text-gray-700">
                                <Filter className="w-4 h-4 mr-2" />
                                Filter
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Notifications List */}
                <div className="space-y-4">
                    {filteredNotifications.map((notification) => (
                        <Card key={notification.id} className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <div className="flex items-center space-x-2">
                                                {getTypeIcon(notification.type)}
                                                <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                                            </div>
                                            {getTypeBadge(notification.type)}
                                            {getPriorityBadge(notification.priority)}
                                            {!notification.read && (
                                                <Badge className="bg-blue-100 text-blue-800">New</Badge>
                                            )}
                                        </div>
                                        <p className="text-gray-700 mb-3">{notification.message}</p>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                            <div className="flex items-center space-x-1">
                                                <User className="w-4 h-4" />
                                                <span>{notification.user.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Clock className="w-4 h-4" />
                                                <span>{new Date(notification.createdAt).toLocaleString()}</span>
                                            </div>
                                            {notification.targetAudience && (
                                                <div className="flex items-center space-x-1">
                                                    <Mail className="w-4 h-4" />
                                                    <span>To: {notification.targetAudience}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex space-x-2 ml-4">
                                        {!notification.read && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleMarkAsRead(notification.id)}
                                                className="border-gray-300 text-gray-700"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDeleteNotification(notification.id)}
                                            className="border-gray-300 text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {filteredNotifications.length === 0 && (
                    <div className="text-center py-12">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                        <p className="text-gray-600">
                            {search ? 'Try adjusting your search criteria.' : 'No notifications have been sent yet.'}
                        </p>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}


