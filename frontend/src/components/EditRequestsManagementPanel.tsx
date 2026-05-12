import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { Check, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { apiUrl } from '@/constants/api';

interface EditRequest {
  id: number;
  employee: number;
  employee_name: string;
  changes_preview: string;
  requested_data: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: any;
  reviewed_at: string;
  notes: string;
  image_url: string;
  created_at: string;
}

export const EditRequestsPanel = () => {
  const { success, error } = useToast();
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchEditRequests();
  }, [filterStatus]);
  
  const fetchEditRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(apiUrl(`edit-requests${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      const data = await response.json();
      setEditRequests(data.results || data);
    } catch (err) {
      error('Failed to fetch edit requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`edit-requests/${requestId}/approve/`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to approve');
      success('Edit request approved successfully');
      fetchEditRequests();
    } catch (err) {
      error('Failed to approve edit request');
      console.error(err);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`edit-requests/${requestId}/reject/`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: rejectNotes[requestId] || ''
        })
      });
      if (!response.ok) throw new Error('Failed to reject');
      success('Edit request rejected successfully');
      setRejectNotes(prev => {
        const newNotes = { ...prev };
        delete newNotes[requestId];
        return newNotes;
      });
      fetchEditRequests();
    } catch (err) {
      error('Failed to reject edit request');
      console.error(err);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 lg:ml-64">
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">Loading edit requests...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />

    <div className="p-4 lg:p-6 lg:ml-64 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Edit Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve/reject employee edit requests</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(status => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus(status)}
            className="capitalize"
          >
            {status}
          </Button>
        ))}
      </div>

      {/* Edit Requests List */}
      {editRequests.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No edit requests found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {editRequests.map((request) => (
            <Card key={request.id} className="p-0">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{request.employee_name}</h3>
                    <Badge variant={getStatusBadgeVariant(request.status)}>
                      {request.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {request.changes_preview}
                  </p>
                  <p className="text-xs text-gray-500">
                    <Clock size={14} className="inline mr-1" />
                    Requested: {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === request.id ? null : request.id)}
                  className="p-2"
                >
                  {expandedId === request.id ? <ChevronUp /> : <ChevronDown />}
                </button>
              </div>

              {/* Expanded Details */}
              {expandedId === request.id && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Requested Changes:</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded space-y-2">
                      {Object.entries(request.requested_data).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <span className="font-medium">{key}:</span>{' '}
                          <span className="text-gray-600 dark:text-gray-300">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {request.image_url && (
                    <div>
                      <h4 className="font-semibold mb-2">Attached Image:</h4>
                      <img
                        src={request.image_url}
                        alt="Attached"
                        className="max-w-xs rounded"
                      />
                    </div>
                  )}

                  {request.status === 'pending' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Rejection Notes (optional)</label>
                        <textarea
                          value={rejectNotes[request.id] || ''}
                          onChange={(e) => setRejectNotes(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          placeholder="Add notes if rejecting..."
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(request.id)}
                          icon={<Check size={18} />}
                          className="flex-1"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="error"
                          onClick={() => handleReject(request.id)}
                          icon={<X size={18} />}
                          className="flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                      <p className="text-sm">
                        <span className="font-medium">Reviewed by:</span> {request.reviewed_by?.username || 'N/A'}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reviewed at:</span> {new Date(request.reviewed_at).toLocaleString()}
                      </p>
                      {request.notes && (
                        <p className="text-sm mt-2">
                          <span className="font-medium">Notes:</span> {request.notes}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  </div>
  );
};
