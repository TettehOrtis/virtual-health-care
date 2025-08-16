import { useState } from 'react';
import { toast } from 'sonner';

export default function TestVideoMeetingEmailPage() {
    const [patientEmail, setPatientEmail] = useState('');
    const [doctorEmail, setDoctorEmail] = useState('');
    const [patientName, setPatientName] = useState('Test Patient');
    const [doctorName, setDoctorName] = useState('Dr. Test Doctor');
    const [meetingUrl, setMeetingUrl] = useState('https://meet.jit.si/test-meeting-123');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('/api/test-video-meeting-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    patientEmail,
                    doctorEmail,
                    patientName,
                    doctorName,
                    meetingUrl
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Test video meeting emails sent successfully!');
                setMessage('Test video meeting emails sent successfully');
            } else {
                throw new Error(data.message || 'Failed to send test email');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to send test email');
            setMessage(error instanceof Error ? error.message : 'Failed to send test email');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Test Video Meeting Email
                </h1>

                <p className="text-gray-600 mb-6 text-center">
                    Test the video consultation meeting email functionality with meeting URLs.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="patientEmail" className="block text-sm font-medium text-gray-700 mb-2">
                            Patient Email
                        </label>
                        <input
                            type="email"
                            id="patientEmail"
                            value={patientEmail}
                            onChange={(e) => setPatientEmail(e.target.value)}
                            placeholder="patient@example.com"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="doctorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                            Doctor Email
                        </label>
                        <input
                            type="email"
                            id="doctorEmail"
                            value={doctorEmail}
                            onChange={(e) => setDoctorEmail(e.target.value)}
                            placeholder="doctor@example.com"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="patientName" className="block text-sm font-medium text-gray-700 mb-2">
                            Patient Name
                        </label>
                        <input
                            type="text"
                            id="patientName"
                            value={patientName}
                            onChange={(e) => setPatientName(e.target.value)}
                            placeholder="Test Patient"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700 mb-2">
                            Doctor Name
                        </label>
                        <input
                            type="text"
                            id="doctorName"
                            value={doctorName}
                            onChange={(e) => setDoctorName(e.target.value)}
                            placeholder="Dr. Test Doctor"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="meetingUrl" className="block text-sm font-medium text-gray-700 mb-2">
                            Meeting URL
                        </label>
                        <input
                            type="url"
                            id="meetingUrl"
                            value={meetingUrl}
                            onChange={(e) => setMeetingUrl(e.target.value)}
                            placeholder="https://meet.jit.si/meeting-id"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !patientEmail || !doctorEmail}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Sending...' : 'Send Test Video Meeting Emails'}
                    </button>
                </form>

                {message && (
                    <div className={`mt-4 p-4 rounded-md ${message.includes('successfully')
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="mt-8 p-4 bg-blue-50 rounded-md">
                    <h3 className="font-medium text-blue-900 mb-2">What this test does:</h3>
                    <ul className="text-blue-800 text-sm space-y-1">
                        <li>• Sends a test video consultation meeting email to both patient and doctor</li>
                        <li>• Includes meeting URL and instructions</li>
                        <li>• Tests the new VIDEO_MEETING email template</li>
                        <li>• Verifies email service integration</li>
                    </ul>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <h3 className="font-medium text-gray-900 mb-2">Email Features:</h3>
                    <ul className="text-gray-700 text-sm space-y-1">
                        <li>• Professional HTML template with meeting details</li>
                        <li>• Clickable meeting link</li>
                        <li>• Technical requirements and instructions</li>
                        <li>• Sent to both patient and doctor</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
