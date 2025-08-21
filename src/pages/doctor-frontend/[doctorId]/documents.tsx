import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import MainLayout from "@/components/layout/mainlayout";
import DashboardSidebar from "@/components/dashboard/dashboardsidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard,
  Calendar,
  FileText,
  UserCircle,
  Users,
  MessageCircle,
  Upload,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DoctorDocument {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  size: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  uploadedAt: string;
  fileUrl: string;
  publicUrl?: string;
}

const DoctorDocuments = () => {
  const router = useRouter();
  const { doctorId } = router.query;
  const [documents, setDocuments] = useState<DoctorDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    file: null as File | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = documents.filter((d) => {
    const matchesSearch = search
      ? d.title.toLowerCase().includes(search.toLowerCase()) || d.fileName.toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesStatus = statusFilter === "all" ? true : d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Define sidebar items with the doctorId in the paths
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
      href: `/doctor-frontend/${doctorId}/documents`,
      icon: FileText,
      title: "Documents",
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

  useEffect(() => {
    if (router.isReady) {
      fetchDocuments();
    }
  }, [router.isReady]);

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/doctors/documents', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        toast.error('Failed to fetch documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Check file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, image, or document files.');
        return;
      }

      setNewDocument(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!newDocument.title.trim()) {
      toast.error('Please provide a document title');
      return;
    }
    if (!newDocument.file) {
      toast.error('Please select a file to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('title', newDocument.title);
      formData.append('file', newDocument.file);

      const response = await fetch('/api/doctors/upload-document', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      setUploadProgress(100);

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setNewDocument({ title: '', file: null });
        setShowUploadForm(false);
        await fetchDocuments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleView = (doc: DoctorDocument) => {
    const url = doc.publicUrl;
    if (!url) {
      toast.error('File URL is not available');
      return;
    }
    window.open(url, '_blank');
  };

  const handleDownload = (doc: DoctorDocument) => {
    const url = doc.publicUrl;
    if (!url) {
      toast.error('File URL is not available');
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName || 'document';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'SUSPENDED':
        return <Badge className="bg-gray-100 text-gray-500"><AlertTriangle className="w-3 h-3 mr-1" />Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex">
          <DashboardSidebar items={sidebarItems} />
          <div className="flex-1 p-6">
            <div className="flex justify-center items-center h-64">
              <div className="text-gray-600">Loading documents...</div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex h-[calc(100vh-80px)]">
        <DashboardSidebar items={sidebarItems} />
        <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
                <p className="text-sm text-gray-600 mt-1">Upload and manage your professional documents for admin approval</p>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
              <div className="flex-1 flex gap-3">
                <Input
                  placeholder="Search documents..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="max-w-xl bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-44 bg-white border border-gray-300 rounded-lg shadow-sm text-gray-700 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Button onClick={() => setShowUploadForm(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2 text-green-500 hover:text-white hover:bg-primary/90 " /> 
                  <span className="text-green-500 hover:text-blue-500">Upload</span>
                </Button>
              </div>
            </div>

            {/* Upload Form */}
            {showUploadForm && (
              <Card className="bg-white rounded-lg shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload New Document
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Medical License, Certification, etc."
                      value={newDocument.title}
                      onChange={(e) => setNewDocument(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="file">Select File</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Supported formats: PDF, Images, Documents (Max 10MB)
                    </p>
                  </div>

                  {uploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {uploading ? 'Uploading...' : 'Upload Document'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowUploadForm(false);
                        setNewDocument({ title: '', file: null });
                      }}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Documents List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Your Documents</h2>

              {filtered.length === 0 ? (
                <Card className="bg-white rounded-lg shadow-sm border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <FileText className="w-12 h-12 text-gray-500 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matching documents</h3>
                    <p className="text-gray-600 text-center mb-4">
                      {documents.length === 0 ? 'You have not uploaded any documents yet.' : 'Try adjusting your search or filters.'}
                    </p>
                    <Button onClick={() => setShowUploadForm(true)}>
                      <Upload className="w-4 h-4 mr-2" /> Upload Document
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.map((doc) => (
                    <Card key={doc.id} className="bg-white shadow-sm transition hover:shadow-md">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 p-2.5 rounded-lg">
                              <FileText className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 line-clamp-1" title={doc.title}>{doc.title}</h3>
                              <p className="text-xs text-gray-600 line-clamp-1" title={doc.fileName}>{doc.fileName}</p>
                            </div>
                          </div>
                          {getStatusBadge(doc.status)}
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                          <span>{formatFileSize(doc.size)}</span>
                          <span>•</span>
                          <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button size="sm" variant="outline" onClick={() => handleView(doc)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(doc)}>
                            <Download className="w-4 h-4 mr-1" /> Download
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default DoctorDocuments;
