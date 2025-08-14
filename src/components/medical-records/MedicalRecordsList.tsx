import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Trash2, Calendar, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface MedicalRecord {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileType: string;
  fileName: string;
  size: number;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

const MedicalRecordsList = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('/api/patients/medical-records', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch medical records');
      }

      const data = await response.json();
      setRecords(data);
    } catch (error: any) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return;
    }

    setDeleting(recordId);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(`/api/patients/medical-records?recordId=${recordId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete medical record');
      }

      toast.success('Medical record deleted successfully');
      setRecords(records.filter(record => record.id !== recordId));
    } catch (error: any) {
      console.error('Error deleting record:', error);
      toast.error('Failed to delete medical record');
    } finally {
      setDeleting(null);
    }
  };

  const deriveStoragePath = (fileUrl: string): string => {
    // If already a relative path (no scheme), return as-is
    if (!fileUrl.startsWith('http')) return fileUrl;
    // Handle both public and signed URL variants
    const markers = [
      '/storage/v1/object/public/medical-records/',
      '/storage/v1/object/sign/medical-records/'
    ];
    for (const marker of markers) {
      const idx = fileUrl.indexOf(marker);
      if (idx !== -1) return fileUrl.substring(idx + marker.length);
    }
    // Fallback: try to find after last occurrence of '/medical-records/'
    const genericIdx = fileUrl.lastIndexOf('/medical-records/');
    if (genericIdx !== -1) return fileUrl.substring(genericIdx + '/medical-records/'.length);
    // Could not derive, return original (frontend will fallback to direct link)
    return fileUrl;
  };

  const downloadRecord = async (record: MedicalRecord) => {
    try {
      // Prefer server-signed URL to avoid client auth/session issues
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch(`/api/patients/medical-records-sign?recordId=${record.id}&downloadName=${encodeURIComponent(record.fileName)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to get signed URL');
      const { url } = await res.json();
      if (!url) throw new Error('Signed URL missing');
      window.location.href = url;
    } catch (e) {
      const link = document.createElement('a');
      link.href = record.fileUrl;
      link.download = record.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text')) return '📝';
    if (fileType.includes('word')) return '📄';
    return '📎';
  };

  const getFileTypeLabel = (fileType: string) => {
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('image')) return 'Image';
    if (fileType.includes('text')) return 'Text';
    if (fileType.includes('word')) return 'Word';
    return 'Document';
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading medical records...</span>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Medical Records</h3>
          <p className="text-gray-600">You haven't uploaded any medical records yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Medical Records</h2>
        <Badge variant="secondary">{records.length} record{records.length !== 1 ? 's' : ''}</Badge>
      </div>

      <div className="grid gap-4">
        {records.map((record) => (
          <Card key={record.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{getFileIcon(record.fileType)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{record.title}</h3>
                    {record.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{record.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(record.uploadedAt)}
                      </span>
                      <span>{formatFileSize(record.size)}</span>
                      <Badge variant="outline" className="text-xs">
                        {getFileTypeLabel(record.fileType)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadRecord(record)}
                    className="flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteRecord(record.id)}
                    disabled={deleting === record.id}
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    {deleting === record.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MedicalRecordsList; 