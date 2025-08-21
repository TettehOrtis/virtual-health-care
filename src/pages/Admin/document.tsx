import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { FileText, Plus, Search, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MedicalRecordRow {
  id: string;
  title: string;
  fileType: string;
  fileName: string;
  uploadedAt: string;
  patientName: string;
}

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<MedicalRecordRow[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch('/api/admin/medical-records', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (!res.ok) throw new Error('Failed to load documents');
        const data = await res.json();
        setDocuments(data.records);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'pending': return 'bg-warning/10 text-warning';
      case 'archived': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Document Management</h2>
            <p className="text-muted-foreground">Manage and organize healthcare documents</p>
          </div>
          <Button className="bg-gradient-primary hover:bg-primary-hover text-primary-foreground shadow-hover">
            <Plus className="w-4 h-4 mr-2" />
            New Document
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-gradient-card border border-border rounded-xl p-6 shadow-card">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="border-border">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-gradient-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border">
                <tr>
                  <th className="text-left p-4 font-semibold text-foreground">Document</th>
                  <th className="text-left p-4 font-semibold text-foreground">Type</th>
                  <th className="text-left p-4 font-semibold text-foreground">Patient</th>
                  <th className="text-left p-4 font-semibold text-foreground">Uploaded</th>
                  <th className="text-left p-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-4 text-muted-foreground" colSpan={5}>Loading documents...</td>
                  </tr>
                ) : (
                  documents
                    .filter((d) => [d.title, d.fileType, d.fileName, d.patientName].some(v => v.toLowerCase().includes(searchTerm.toLowerCase())))
                    .map((doc) => (
                      <tr key={doc.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{doc.title}</p>
                              <p className="text-sm text-muted-foreground">{doc.fileName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-foreground">{doc.fileType}</td>
                        <td className="p-4 text-foreground">{doc.patientName}</td>
                        <td className="p-4 text-foreground">{new Date(doc.uploadedAt).toLocaleString()}</td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="border-border">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border">
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-border text-destructive hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}