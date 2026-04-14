'use client';

import { useState, useEffect } from 'react';

interface AuditEntry {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

const actionColors: Record<string, string> = {
  'booking.status_change': 'text-blue-400',
  'review.approve': 'text-green-400',
  'review.hide': 'text-yellow-400',
  'review.delete': 'text-red-400',
  'artist.create': 'text-purple-400',
  'artist.update': 'text-purple-400',
  'gallery.upload': 'text-accent',
  'gallery.delete': 'text-red-400',
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLogs(data.data || []);
          setTotal(data.pagination?.total || 0);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 font-heading text-2xl text-text-primary">Audit Log</h1>
      <p className="mb-6 text-sm text-text-muted">{total} events recorded</p>

      {logs.length === 0 ? (
        <div className="rounded-sm border border-border bg-bg-secondary p-12 text-center">
          <p className="text-text-muted">No audit events yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-4 rounded-sm border border-border bg-bg-secondary p-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${actionColors[log.action] || 'text-text-primary'}`}>
                    {log.action}
                  </span>
                  <span className="text-xs text-text-muted">
                    on {log.targetType}
                    {log.targetId ? ` #${log.targetId}` : ''}
                  </span>
                </div>
                <p className="mt-1 text-xs text-text-muted">
                  by {log.user.name} ({log.user.role})
                </p>
                {log.details && (
                  <pre className="mt-2 max-w-lg overflow-x-auto rounded bg-bg-tertiary p-2 text-xs text-text-secondary">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
              <span className="shrink-0 text-xs text-text-muted">
                {new Date(log.createdAt).toLocaleString('ro-RO')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
