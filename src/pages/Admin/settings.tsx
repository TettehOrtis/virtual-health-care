import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Settings,
    Shield,
    Bell,
    Mail,
    Database,
    Users,
    Globe,
    Save,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Info,
    Key,
    Server,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
    platformName: string;
    platformDescription: string;
    supportEmail: string;
    supportPhone: string;
    maxFileSize: number;
    allowedFileTypes: string[];
    emailNotifications: boolean;
    smsNotifications: boolean;
    maintenanceMode: boolean;
    autoBackup: boolean;
    backupFrequency: string;
    sessionTimeout: number;
    maxLoginAttempts: number;
    passwordMinLength: number;
    requireEmailVerification: boolean;
    allowSelfRegistration: boolean;
    defaultUserRole: string;
    apiRateLimit: number;
    logRetentionDays: number;
}

interface SecuritySettings {
    twoFactorAuth: boolean;
    passwordExpiry: number;
    sessionTimeout: number;
    ipWhitelist: string[];
    allowedDomains: string[];
    encryptionLevel: string;
    auditLogging: boolean;
}

export default function AdminSettings() {
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        platformName: 'Virtual Healthcare Platform',
        platformDescription: 'A comprehensive healthcare management system',
        supportEmail: 'support@healthcare.com',
        supportPhone: '+1-800-HEALTH',
        maxFileSize: 10,
        allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
        emailNotifications: true,
        smsNotifications: false,
        maintenanceMode: false,
        autoBackup: true,
        backupFrequency: 'daily',
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireEmailVerification: true,
        allowSelfRegistration: true,
        defaultUserRole: 'PATIENT',
        apiRateLimit: 1000,
        logRetentionDays: 30
    });

    const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
        twoFactorAuth: false,
        passwordExpiry: 90,
        sessionTimeout: 30,
        ipWhitelist: [],
        allowedDomains: [],
        encryptionLevel: 'AES-256',
        auditLogging: true
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Load settings from API
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/admin/settings', {
                headers: { Authorization: token ? `Bearer ${token}` : '' }
            });
            if (res.ok) {
                const data = await res.json();
                setSystemSettings(data.system || systemSettings);
                setSecuritySettings(data.security || securitySettings);
            }
        } catch (err) {
            console.error('Failed to load settings:', err);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    system: systemSettings,
                    security: securitySettings
                })
            });

            if (res.ok) {
                toast.success('Settings saved successfully');
            } else {
                toast.error('Failed to save settings');
            }
        } catch (err) {
            console.error('Failed to save settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            loadSettings();
            toast.info('Settings reset to defaults');
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="space-y-6">
                    <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
                    <div className="text-gray-600">Loading settings...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">System Settings</h2>
                        <p className="text-gray-600">Configure platform settings and preferences</p>
                    </div>
                    <div className="flex space-x-2">
                        <Button
                            variant="outline"
                            onClick={resetToDefaults}
                            className="border-gray-300 text-gray-700"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Reset
                        </Button>
                        <Button
                            onClick={saveSettings}
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {saving ? (
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Save Settings
                        </Button>
                    </div>
                </div>

                {/* System Information */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Globe className="w-5 h-5 mr-2" />
                            Platform Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="platformName" className="text-gray-700">Platform Name</Label>
                                <Input
                                    id="platformName"
                                    value={systemSettings.platformName}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, platformName: e.target.value }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="supportEmail" className="text-gray-700">Support Email</Label>
                                <Input
                                    id="supportEmail"
                                    type="email"
                                    value={systemSettings.supportEmail}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="supportPhone" className="text-gray-700">Support Phone</Label>
                                <Input
                                    id="supportPhone"
                                    value={systemSettings.supportPhone}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="defaultUserRole" className="text-gray-700">Default User Role</Label>
                                <select
                                    id="defaultUserRole"
                                    value={systemSettings.defaultUserRole}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultUserRole: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                                >
                                    <option value="PATIENT">Patient</option>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="platformDescription" className="text-gray-700">Platform Description</Label>
                            <Textarea
                                id="platformDescription"
                                value={systemSettings.platformDescription}
                                onChange={(e) => setSystemSettings(prev => ({ ...prev, platformDescription: e.target.value }))}
                                className="mt-1 bg-white border border-gray-300 text-gray-900"
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* File Upload Settings */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Database className="w-5 h-5 mr-2" />
                            File Upload Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="maxFileSize" className="text-gray-700">Max File Size (MB)</Label>
                                <Input
                                    id="maxFileSize"
                                    type="number"
                                    value={systemSettings.maxFileSize}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="allowedFileTypes" className="text-gray-700">Allowed File Types</Label>
                                <Input
                                    id="allowedFileTypes"
                                    value={systemSettings.allowedFileTypes.join(', ')}
                                    onChange={(e) => setSystemSettings(prev => ({
                                        ...prev,
                                        allowedFileTypes: e.target.value.split(',').map(type => type.trim())
                                    }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                    placeholder="pdf, jpg, jpeg, png, doc, docx"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notification Settings */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Bell className="w-5 h-5 mr-2" />
                            Notification Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">Email Notifications</Label>
                                <p className="text-sm text-gray-600">Enable email notifications for users</p>
                            </div>
                            <Switch
                                checked={systemSettings.emailNotifications}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, emailNotifications: checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">SMS Notifications</Label>
                                <p className="text-sm text-gray-600">Enable SMS notifications for users</p>
                            </div>
                            <Switch
                                checked={systemSettings.smsNotifications}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, smsNotifications: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Security Settings */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Shield className="w-5 h-5 mr-2" />
                            Security Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="passwordMinLength" className="text-gray-700">Password Min Length</Label>
                                <Input
                                    id="passwordMinLength"
                                    type="number"
                                    value={systemSettings.passwordMinLength}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="maxLoginAttempts" className="text-gray-700">Max Login Attempts</Label>
                                <Input
                                    id="maxLoginAttempts"
                                    type="number"
                                    value={systemSettings.maxLoginAttempts}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="sessionTimeout" className="text-gray-700">Session Timeout (minutes)</Label>
                                <Input
                                    id="sessionTimeout"
                                    type="number"
                                    value={systemSettings.sessionTimeout}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                            <div>
                                <Label htmlFor="apiRateLimit" className="text-gray-700">API Rate Limit (requests/hour)</Label>
                                <Input
                                    id="apiRateLimit"
                                    type="number"
                                    value={systemSettings.apiRateLimit}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, apiRateLimit: parseInt(e.target.value) }))}
                                    className="mt-1 bg-white border border-gray-300 text-gray-900"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">Require Email Verification</Label>
                                <p className="text-sm text-gray-600">Users must verify their email before accessing the platform</p>
                            </div>
                            <Switch
                                checked={systemSettings.requireEmailVerification}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">Allow Self Registration</Label>
                                <p className="text-sm text-gray-600">Allow users to register themselves</p>
                            </div>
                            <Switch
                                checked={systemSettings.allowSelfRegistration}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, allowSelfRegistration: checked }))}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* System Maintenance */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Server className="w-5 h-5 mr-2" />
                            System Maintenance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">Maintenance Mode</Label>
                                <p className="text-sm text-gray-600">Put the system in maintenance mode</p>
                            </div>
                            <Switch
                                checked={systemSettings.maintenanceMode}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-gray-700">Auto Backup</Label>
                                <p className="text-sm text-gray-600">Automatically backup system data</p>
                            </div>
                            <Switch
                                checked={systemSettings.autoBackup}
                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, autoBackup: checked }))}
                            />
                        </div>
                        {systemSettings.autoBackup && (
                            <div>
                                <Label htmlFor="backupFrequency" className="text-gray-700">Backup Frequency</Label>
                                <select
                                    id="backupFrequency"
                                    value={systemSettings.backupFrequency}
                                    onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value }))}
                                    className="mt-1 w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-gray-900"
                                >
                                    <option value="hourly">Hourly</option>
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        )}
                        <div>
                            <Label htmlFor="logRetentionDays" className="text-gray-700">Log Retention (days)</Label>
                            <Input
                                id="logRetentionDays"
                                type="number"
                                value={systemSettings.logRetentionDays}
                                onChange={(e) => setSystemSettings(prev => ({ ...prev, logRetentionDays: parseInt(e.target.value) }))}
                                className="mt-1 bg-white border border-gray-300 text-gray-900"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* System Status */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center text-gray-900">
                            <Info className="w-5 h-5 mr-2" />
                            System Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Database</p>
                                    <p className="text-sm text-green-700">Connected</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                                <div>
                                    <p className="font-medium text-green-900">Email Service</p>
                                    <p className="text-sm text-green-700">Active</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg">
                                <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                <div>
                                    <p className="font-medium text-yellow-900">Storage</p>
                                    <p className="text-sm text-yellow-700">75% Used</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
