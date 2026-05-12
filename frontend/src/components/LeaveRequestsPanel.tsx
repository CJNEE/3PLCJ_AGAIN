import { useEffect, useState } from 'react';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
import { apiUrl } from '@/constants/api';

type LeaveRequestStatus = 'pending' | 'approved' | 'rejected';

type LeaveRequest = {
  id: number;
  employee: number;
  employee_name: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveRequestStatus;
  reviewed_by: { username?: string } | null;
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
  attachments?: string[];
};

export const LeaveRequestsPanel = ({ initialFilter = 'pending' }: { initialFilter?: LeaveRequestStatus | 'all' }) => {
  const { success, error } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<LeaveRequestStatus | 'all'>(initialFilter);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchLeaveRequests();
  }, [filterStatus]);


  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(apiUrl(`leave-requests${params}`), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (response.status === 401) {
        // auth problem
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) throw new Error('Failed to fetch leave requests');
      const data = await response.json();
      setLeaveRequests(data.results || data);
    } catch (e) {
      error('Failed to fetch leave requests');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`leave-requests/${requestId}/approve/`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Approve error', response.status, text);
        throw new Error('Failed to approve leave request');
      }
      success('Leave request approved successfully');
      fetchLeaveRequests();
    } catch (e) {
      error('Failed to approve leave request');
      console.error(e);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      const response = await fetch(apiUrl(`leave-requests/${requestId}/reject/`), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes: rejectNotes[requestId] || '' }),
      });
      if (response.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('currentEmployee');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const text = await response.text();
        console.error('Reject error', response.status, text);
        throw new Error('Failed to reject leave request');
      }
      success('Leave request rejected successfully');
      setRejectNotes((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
      fetchLeaveRequests();
    } catch (e) {
      error('Failed to reject leave request');
      console.error(e);
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
          <div className="text-center py-8 flex items-center justify-center gap-3">
            <LoadingSpinner />
            <span className="text-gray-500">Loading leave requests...</span>
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
        <h1 className="text-3xl font-bold mb-2">Leave Requests</h1>
        <p className="text-gray-600 dark:text-gray-400">Review and approve/reject employee leave requests</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
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

      {leaveRequests.length === 0 ? (
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No leave requests found</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {leaveRequests.map((request) => (
            <Card key={request.id} className="p-0">
              <div className="p-4 border-b dark:border-gray-700 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold">{request.employee_name}</h3>
                    <Badge variant={getStatusBadgeVariant(request.status)}>{request.status}</Badge>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {request.leave_type} • {request.start_date} to {request.end_date}
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
                  {expandedId === request.id ? <span>▲</span> : <span>▼</span>}
                </button>
              </div>

              {expandedId === request.id && (
                <div className="p-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Leave Details</h4>
                    <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded space-y-2">
                      <div className="text-sm"><span className="font-medium">Type:</span> {request.leave_type}</div>
                      <div className="text-sm"><span className="font-medium">Dates:</span> {request.start_date} → {request.end_date}</div>
                      <div className="text-sm"><span className="font-medium">Reason:</span> {request.reason || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Attachments */}
                  <div>
                    <h4 className="font-semibold mb-2">Attachments</h4>
                    {(!request.attachments || request.attachments.length === 0) ? (
                      <div className="text-sm text-gray-500">No attachments</div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {request.attachments!.map((url, idx) => {
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                          const isPDF = /\.(pdf)$/i.test(url);
                          const nameMatch = url.split('/').pop() || `file-${idx}`;
                          return (
                            <div key={url} className="border rounded p-2 bg-white/5 flex flex-col items-stretch">
                              <div className="flex-1 mb-2 flex items-center justify-center overflow-hidden">
                                {isImage ? (
                                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                                  <a href={url} target="_blank" rel="noreferrer">
                                    <img src={url} alt={`attachment-${idx}`} className="w-full h-28 object-cover rounded" />
                                  </a>
                                ) : isPDF ? (
                                  <a href={url} target="_blank" rel="noreferrer" className="w-full h-28 flex items-center justify-center bg-gray-100 rounded">
                                    <div className="text-sm">PDF Preview</div>
                                  </a>
                                ) : (
                                  <a href={url} target="_blank" rel="noreferrer" className="w-full h-28 flex items-center justify-center bg-gray-100 rounded">
                                    <div className="text-sm">Open File</div>
                                  </a>
                                )}
                              </div>

                              <div className="text-xs truncate mb-2">{nameMatch}</div>

                              <div className="flex gap-2">
                                <a href={url} target="_blank" rel="noreferrer" className="text-sm px-2 py-1 bg-blue-600 text-white rounded text-center flex-1">Open</a>
                                <a href={url} download className="text-sm px-2 py-1 border rounded text-center flex-1">Download</a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {request.status === 'pending' ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">Rejection Notes (optional)</label>
                        <textarea
                          value={rejectNotes[request.id] || ''}
                          onChange={(e) => setRejectNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
                          placeholder="Add notes if rejecting..."
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          variant="success"
                          onClick={() => handleApprove(request.id)}
                          icon={<CheckCircle size={18} />}
                          className="flex-1 min-w-[140px]"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="error"
                          onClick={() => handleReject(request.id)}
                          icon={<XCircle size={18} />}
                          className="flex-1 min-w-[140px]"
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
                        <span className="font-medium">Reviewed at:</span> {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'N/A'}
                      </p>
                      {request.notes && <p className="text-sm mt-2"><span className="font-medium">Notes:</span> {request.notes}</p>}
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

