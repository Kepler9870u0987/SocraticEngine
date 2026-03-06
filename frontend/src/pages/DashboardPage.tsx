import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { documentsApi, type DocumentResponse } from '../api/client';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const res = await documentsApi.list();
      setDocuments(res.documents);
    } catch {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    try {
      const doc = await documentsApi.create('Untitled');
      navigate(`/editor/${doc.id}`);
    } catch {
      // Handle error
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this document?')) return;
    try {
      await documentsApi.delete(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch {
      // Handle error
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('it-IT', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <h1>SocraticEngine</h1>
        </div>
        <div className="dashboard-user">
          <span className="user-name">{user?.display_name}</span>
          <button className="btn-secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <h2>Documents</h2>
          <button className="btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : '+ New Document'}
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="dashboard-empty">
            <p>No documents yet.</p>
            <p>Create your first document to begin the philosophical journey.</p>
          </div>
        ) : (
          <div className="documents-grid">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="document-card"
                onClick={() => navigate(`/editor/${doc.id}`)}
              >
                <h3 className="document-title">{doc.title}</h3>
                <p className="document-date">{formatDate(doc.updated_at)}</p>
                <button
                  className="document-delete"
                  onClick={(e) => handleDelete(doc.id, e)}
                  title="Delete document"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
