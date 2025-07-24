import { useState } from 'react';

interface TestEmailProps {
  email: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
}

const defaultTemplate = `
  <h2>Appointment Confirmation</h2>
  <p>Dear {{doctorName}},</p>
  <p>You have a new appointment scheduled for:</p>
  <ul>
    <li><strong>Date:</strong> {{appointmentDate}}</li>
    <li><strong>Time:</strong> {{appointmentTime}}</li>
  </ul>
  <p>Best regards,</p>
  <p>MediCloudHub Team</p>
`;

export default function TestEmail() {
  const [testProps, setTestProps] = useState<TestEmailProps>({
    email: '',
    doctorName: 'Dr. John Smith',
    appointmentDate: '2025-07-25',
    appointmentTime: '10:00 AM'
  });
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testProps.email,
          subject: 'Appointment Confirmation - MediCloudHub',
          template: defaultTemplate,
          variables: {
            doctorName: testProps.doctorName,
            appointmentDate: testProps.appointmentDate,
            appointmentTime: testProps.appointmentTime
          }
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      setResult('Appointment notification sent successfully!');
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test Appointment Notification System</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Doctor's Email
          </label>
          <input
            type="email"
            id="email"
            value={testProps.email}
            onChange={(e) => setTestProps({ ...testProps, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            placeholder="doctor@example.com"
          />
        </div>

        <div>
          <label htmlFor="doctorName" className="block text-sm font-medium text-gray-700">
            Doctor's Name
          </label>
          <input
            type="text"
            id="doctorName"
            value={testProps.doctorName}
            onChange={(e) => setTestProps({ ...testProps, doctorName: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            placeholder="Dr. John Smith"
          />
        </div>

        <div>
          <label htmlFor="appointmentDate" className="block text-sm font-medium text-gray-700">
            Appointment Date
          </label>
          <input
            type="date"
            id="appointmentDate"
            value={testProps.appointmentDate}
            onChange={(e) => setTestProps({ ...testProps, appointmentDate: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="appointmentTime" className="block text-sm font-medium text-gray-700">
            Appointment Time
          </label>
          <input
            type="time"
            id="appointmentTime"
            value={testProps.appointmentTime}
            onChange={(e) => setTestProps({ ...testProps, appointmentTime: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {loading ? 'Sending...' : 'Send Test Appointment Notification'}
        </button>

        {result && (
          <div className="mt-4 p-4 rounded-md" style={{ backgroundColor: result.startsWith('Appointment notification') ? '#f0fff4' : '#fff4f0' }}>
            {result}
          </div>
        )}
      </form>
    </div>
  );
}
