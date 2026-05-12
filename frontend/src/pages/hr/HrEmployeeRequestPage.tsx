import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGetEditRequests, useApproveEditRequest, useRejectEditRequest } from '@/hooks/useQueries';
import { normalizeApiResponse } from '@/utils/apiResponseHandler';
import { Card, LoadingSpinner, Button, EmptyState } from '@/components/common';

export default function HrEmployeeRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);
  const { data, isLoading, refetch } = useGetEditRequests();
  const requests = normalizeApiResponse(data || []);

  const approve = useApproveEditRequest();
  const reject = useRejectEditRequest();

  const handleApprove = (id: number) => {
    if (!window.confirm('Approve this edit request?')) return;
    approve.mutate(id, { onSuccess: () => refetch() });
  };

  const handleReject = (id: number) => {
    const note = window.prompt('Optional rejection note');
    if (!window.confirm('Reject this edit request?')) return;
    reject.mutate({ id, notes: note || '' }, { onSuccess: () => refetch() });
  };

  return (
    <div className="p-4 lg:p-6 lg:ml-64 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-bold">Edit Requests</h1>
          <p className="text-sm text-gray-600">Review and act on requested employee edits.</p>
        </div>
        <div>
          <Button onClick={() => refetch()}>Refresh</Button>
        </div>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center p-8"><LoadingSpinner /></div>
        ) : !requests.length ? (
          <EmptyState title="No requests" description="No edit requests at the moment." />
        ) : (
          <div className="space-y-3">
            {requests.map((r: any) => (
              <div key={r.id} className="p-3 border rounded flex flex-col md:flex-row md:justify-between items-start md:items-center gap-3">
                <div>
                  <div className="font-semibold">{r.employee_name || r.requested_by_name}</div>
                  <div className="text-sm text-gray-500">Requested: {new Date(r.created_at).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="primary" onClick={() => navigate(`/hr/edit-requests/${r.id}`)}>View</Button>
                  <Button size="sm" variant="success" onClick={() => handleApprove(r.id)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(r.id)}>Reject</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
