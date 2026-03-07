/**
 * <VersionPanel /> — sidebar panel showing the document's version timeline.
 *
 * Features:
 * - Reverse-chronological list of versions
 * - Preview version content (read-only)
 * - Rollback to any older version
 */

import { useEffect, useState, useCallback } from 'react';
import { documentsApi, type VersionResponse, type DocumentDetailResponse } from '../api/client';
import VersionDiff from './VersionDiff';
import './VersionPanel.css';

interface VersionPanelProps {
  documentId: string;
  currentVersionNumber: number;
  currentContent: string;
  onRollback: (doc: DocumentDetailResponse) => void;
}

export default function VersionPanel({
  documentId,
  currentVersionNumber,
  currentContent,
  onRollback,
}: VersionPanelProps) {
  const [versions, setVersions] = useState<VersionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const [diffVersionId, setDiffVersionId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await documentsApi.listVersions(documentId);
      // Sort by version_number descending
      data.sort((a, b) => b.version_number - a.version_number);
      setVersions(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions, currentVersionNumber]);

  const handleRollback = async (versionId: string) => {
    if (rollingBack) return;
    setRollingBack(versionId);
    try {
      const updated = await documentsApi.rollback(documentId, versionId);
      onRollback(updated);
      await loadVersions();
    } catch {
      // silent
    } finally {
      setRollingBack(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncate = (text: string, max = 200) => {
    // Strip HTML tags for preview
    const plain = text.replace(/<[^>]+>/g, '');
    return plain.length > max ? plain.slice(0, max) + '…' : plain;
  };

  if (loading && versions.length === 0) {
    return (
      <div className="version-panel">
        <div className="version-panel-loading">Loading versions…</div>
      </div>
    );
  }

  return (
    <div className="version-panel">
      <div className="version-panel-header">
        <h4>Version History</h4>
        <button className="version-refresh" onClick={loadVersions} title="Refresh">
          ↻
        </button>
      </div>

      {versions.length === 0 ? (
        <div className="version-panel-empty">No versions yet.</div>
      ) : (
        <ul className="version-list">
          {versions.map((v) => {
            const isCurrent = v.version_number === currentVersionNumber;
            const isExpanded = expandedId === v.id;

            return (
              <li
                key={v.id}
                className={`version-item ${isCurrent ? 'version-current' : ''} ${isExpanded ? 'version-expanded' : ''}`}
              >
                <button
                  className="version-item-header"
                  onClick={() => setExpandedId(isExpanded ? null : v.id)}
                >
                  <span className="version-number">v{v.version_number}</span>
                  <span className="version-date">{formatDate(v.created_at)}</span>
                  {isCurrent && <span className="version-badge">current</span>}
                </button>

                {isExpanded && (
                  <div className="version-detail">
                    {v.commit_message && (
                      <p className="version-commit">{v.commit_message}</p>
                    )}
                    <div className="version-preview">{truncate(v.content)}</div>
                    {!isCurrent && (
                      <>
                        <div className="version-actions">
                          <button
                            className="btn-secondary version-diff-btn"
                            onClick={() => setDiffVersionId(
                              diffVersionId === v.id ? null : v.id
                            )}
                          >
                            {diffVersionId === v.id ? '✕ chiudi diff' : '◊ mostra diff'}
                          </button>
                          <button
                            className="btn-secondary version-rollback-btn"
                            disabled={rollingBack === v.id}
                            onClick={() => handleRollback(v.id)}
                          >
                            {rollingBack === v.id ? 'Rolling back…' : 'Rollback to this version'}
                          </button>
                        </div>
                        {diffVersionId === v.id && (
                          <VersionDiff
                            oldText={v.content}
                            newText={currentContent}
                          />
                        )}
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
