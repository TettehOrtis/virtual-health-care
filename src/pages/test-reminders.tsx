import { useState } from 'react';
import { toast } from 'sonner';

export default function TestRemindersPage() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleSendReminders = async () => {
        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/appointments/reminders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Appointment reminders processed successfully!');
                setResult(data);
            } else {
                throw new Error(data.message || 'Failed to process reminders');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to process reminders');
            setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Test Appointment Reminders
                </h1>

                <p className="text-gray-600 mb-6 text-center">
                    Test the appointment reminder system that sends 24-hour reminders for upcoming appointments.
                </p>

                <div className="text-center mb-8">
                    <button
                        onClick={handleSendReminders}
                        disabled={loading}
                        className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium"
                    >
                        {loading ? 'Processing...' : 'Send Appointment Reminders'}
                    </button>
                </div>

                {result && (
                    <div className="mt-8">
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Results:</h3>

                        {result.error ? (
                            <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-md">
                                <strong>Error:</strong> {result.error}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
                                    <strong>Success:</strong> {result.message}
                                </div>

                                <div className="p-4 bg-blue-50 text-blue-800 border border-blue-200 rounded-md">
                                    <strong>Total Appointments:</strong> {result.totalAppointments}
                                </div>

                                {result.results && result.results.length > 0 && (
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Individual Results:</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Appointment ID
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Patient Email
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Doctor Email
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Type
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Has Meeting URL
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Status
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {result.results.map((item: any, index: number) => (
                                                        <tr key={index}>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                                {item.appointmentId}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.patientEmail}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.doctorEmail}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.type}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                {item.hasMeetingUrl ? 'Yes' : 'No'}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${item.status === 'sent'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-red-100 text-red-800'
                                                                    }`}>
                                                                    {item.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">What this test does:</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Finds all approved appointments scheduled for tomorrow</li>
                        <li>• Sends reminder emails to both patients and doctors</li>
                        • Includes meeting URLs for video consultations</li>
                    <li>• Provides detailed results of the reminder process</li>
                </ul>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Reminder Features:</h3>
                <ul className="text-gray-700 text-sm space-y-1">
                    <li>• 24-hour advance notification</li>
                    <li>• Automatic meeting URL inclusion for video calls</li>
                    <li>• Sent to both patient and doctor</li>
                    <li>• Professional HTML email templates</li>
                    <li>• Error handling and logging</li>
                </ul>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 rounded-md">
                <h3 className="font-medium text-yellow-900 mb-2">Note:</h3>
                <p className="text-yellow-800 text-sm">
                    This endpoint is designed to be called by a cron job or scheduled task system.
                    In production, you would set up a cron job to call this endpoint daily at a specific time
                    (e.g., 9:00 AM) to send reminders for appointments scheduled for the next day.
                </p>
            </div>
        </div>
    </div >
  );
}
