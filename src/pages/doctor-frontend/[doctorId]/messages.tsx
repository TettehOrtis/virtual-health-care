import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import MainLayout from '@/components/layout/mainlayout';
import DashboardSidebar from '@/components/dashboard/dashboardsidebar';
import {
    Send,
    Clock,
    Calendar,
    AlertCircle,
    User,
    Phone,
    Mail,
    MessageCircle,
    LayoutDashboard,
    Users,
    FileText,
    UserCircle
} from 'lucide-react';

interface Message {
    id: string;
    content: string;
    createdAt: string;
    sender: {
        id: string;
        fullName: string;
        email: string;
    };
}

interface Conversation {
    id: string;
    patientId: string;
    doctorId: string;
    createdAt: string;
    patient: {
        id: string;
        fullName: string;
        email: string;
    };
    doctor: {
        id: string;
        fullName: string;
        email: string;
    };
    messages: Message[];
}

interface ChatStatus {
    active: boolean;
    reason: string;
    remainingDays?: number;
    appointmentEndTime?: string;
    chatWindowEnd?: string;
}

export default function Messages() {
    const { user } = useAuth();
    const router = useRouter();
    const { doctorId } = router.query;

    // Get token from localStorage/sessionStorage
    const getToken = () => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('token') || sessionStorage.getItem('token');
        }
        return null;
    };

    // Define sidebar items
    const sidebarItems = [
        {
            title: 'Dashboard',
            href: `/doctor-frontend/${doctorId}/dashboard`,
            icon: LayoutDashboard,
        },
        {
            title: 'Appointments',
            href: `/doctor-frontend/${doctorId}/appointments`,
            icon: Calendar,
        },
        {
            href: `/doctor-frontend/${doctorId}/patients`,
            icon: Users,
            title: "My Patients",
        },
        {
            href: `/doctor-frontend/${doctorId}/prescriptions`,
            icon: FileText,
            title: "Prescriptions",
        },
        {
            href: `/doctor-frontend/${doctorId}/messages`,
            icon: MessageCircle,
            title: "Messages",
        },
        {
            href: `/doctor-frontend/${doctorId}/profile`,
            icon: UserCircle,
            title: "My Profile",
        }
    ];

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [chatStatus, setChatStatus] = useState<ChatStatus | null>(null);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [subscription, setSubscription] = useState<any>(null);

    // Fetch conversations on component mount
    useEffect(() => {
        if (user && getToken()) {
            fetchConversations();
        }
    }, [user]);

    // Set up real-time subscription when conversation is selected
    useEffect(() => {
        if (selectedConversation) {
            setupRealtimeSubscription();
            fetchMessages();
            checkChatStatus();
        }

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, [selectedConversation]);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await fetch('/api/conversations', {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setConversations(data.conversations || []);
            } else {
                console.error('Failed to fetch conversations');
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async () => {
        if (!selectedConversation) return;

        try {
            const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(data.messages || []);
            } else {
                console.error('Failed to fetch messages');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const checkChatStatus = async () => {
        if (!selectedConversation) return;

        try {
            const response = await fetch(`/api/conversations/${selectedConversation.id}/active`, {
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setChatStatus(data);
            } else {
                console.error('Failed to check chat status');
            }
        } catch (error) {
            console.error('Error checking chat status:', error);
        }
    };

    const setupRealtimeSubscription = () => {
        if (!selectedConversation) return;

        const sub = supabase
            .channel(`messages:${selectedConversation.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversationId=eq.${selectedConversation.id}`,
                },
                () => {
                    // Re-fetch to keep message shape consistent with API normalization
                    fetchMessages();
                }
            )
            .subscribe();

        setSubscription(sub);
    };

    const sendMessage = async () => {
        if (!selectedConversation || !newMessage.trim() || sending) return;

        setSending(true);
        try {
            const response = await fetch(`/api/conversations/${selectedConversation.id}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content: newMessage.trim() }),
            });

            if (response.ok) {
                setNewMessage('');
                // Message will be added via real-time subscription
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setSending(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    const getPatientName = (conversation: Conversation) => {
        return conversation?.patient?.fullName ?? 'Unknown Patient';
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex h-[calc(100vh-80px)]">
                    <DashboardSidebar items={sidebarItems} />
                    <div className="flex-1 overflow-auto bg-gray-50 p-8">
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading conversations...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    return (
        <MainLayout>
            <div className="flex h-[calc(100vh-80px)]">
                <DashboardSidebar items={sidebarItems} />
                <div className="flex-1 overflow-auto bg-gray-50 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">Messages</h1>
                            <p className="text-gray-600 mt-1">Chat with your patients</p>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
                            {/* Conversations List */}
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MessageCircle className="h-5 w-5" />
                                        Conversations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ScrollArea className="h-[calc(100vh-12rem)]">
                                        {conversations.length === 0 ? (
                                            <div className="text-center py-8 text-gray-500">
                                                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                <p>No conversations yet</p>
                                                <p className="text-sm">Start by booking an appointment with a patient</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {conversations.map((conversation) => (
                                                    <div
                                                        key={conversation.id}
                                                        onClick={() => setSelectedConversation(conversation)}
                                                        className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation?.id === conversation.id
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'hover:bg-gray-50 border border-transparent'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarFallback>
                                                                    {getPatientName(conversation)?.charAt(0) || '?'}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium text-sm truncate">
                                                                    {getPatientName(conversation)}
                                                                </p>
                                                                <p className="text-xs text-gray-500 truncate">
                                                                    {conversation.messages.length > 0
                                                                        ? conversation.messages[conversation.messages.length - 1].content
                                                                        : 'No messages yet'}
                                                                </p>
                                                            </div>
                                                            {conversation.messages.length > 0 && (
                                                                <div className="text-xs text-gray-400">
                                                                    {formatTime(conversation.messages[conversation.messages.length - 1].createdAt)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            {/* Chat Area */}
                            <Card className="lg:col-span-2">
                                {selectedConversation ? (
                                    <>
                                        <CardHeader className="border-b">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarFallback>
                                                            {getPatientName(selectedConversation)?.charAt(0) || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            {getPatientName(selectedConversation)}
                                                        </CardTitle>
                                                        <div className="flex items-center gap-4 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3" />
                                                                {selectedConversation.patient.email}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {formatDate(selectedConversation.createdAt)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chat Status Badge */}
                                                {chatStatus && (
                                                    <Badge
                                                        variant={chatStatus.active ? "default" : "destructive"}
                                                        className="flex items-center gap-1"
                                                    >
                                                        {chatStatus.active ? (
                                                            <>
                                                                <Clock className="h-3 w-3" />
                                                                {chatStatus.remainingDays} day(s) left
                                                            </>
                                                        ) : (
                                                            <>
                                                                <AlertCircle className="h-3 w-3" />
                                                                Chat Closed
                                                            </>
                                                        )}
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-0">
                                            {/* Messages Area */}
                                            <div className="h-[calc(100vh-16rem)] flex flex-col">
                                                <ScrollArea className="flex-1 p-4">
                                                    {messages.length === 0 ? (
                                                        <div className="text-center py-8 text-gray-500">
                                                            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                                            <p>No messages yet</p>
                                                            <p className="text-sm">Start the conversation!</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {messages.map((message) => (
                                                                <div
                                                                    key={message.id}
                                                                    className={`flex ${message.sender.id === user.id ? 'justify-end' : 'justify-start'
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.sender.id === user.id
                                                                            ? 'bg-blue-600 text-white'
                                                                            : 'bg-gray-100 text-gray-900'
                                                                            }`}
                                                                    >
                                                                        <p className="text-sm">{message.content}</p>
                                                                        <p
                                                                            className={`text-xs mt-1 ${message.sender.id === user.id
                                                                                ? 'text-blue-100'
                                                                                : 'text-gray-500'
                                                                                }`}
                                                                        >
                                                                            {formatTime(message.createdAt)}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div ref={messagesEndRef} />
                                                        </div>
                                                    )}
                                                </ScrollArea>

                                                {/* Message Input */}
                                                <div className="border-t p-4">
                                                    {chatStatus?.active ? (
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                                                placeholder="Type your message..."
                                                                disabled={sending}
                                                                className="flex-1"
                                                            />
                                                            <Button
                                                                onClick={sendMessage}
                                                                disabled={!newMessage.trim() || sending}
                                                                size="sm"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-4 text-gray-500">
                                                            <AlertCircle className="h-5 w-5 mx-auto mb-2" />
                                                            <p className="text-sm">{chatStatus?.reason}</p>
                                                            <Button
                                                                onClick={() => router.push(`/doctor-frontend/${doctorId}/appointments`)}
                                                                className="mt-2"
                                                                size="sm"
                                                            >
                                                                Book Appointment
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </>
                                ) : (
                                    <CardContent className="flex items-center justify-center h-full">
                                        <div className="text-center text-gray-500">
                                            <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                                            <p className="text-lg">Select a conversation to start chatting</p>
                                            <p className="text-sm">Choose from the list on the left</p>
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
