import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { editRequestAPI } from '@/api/apiService';
import { useApproveEditRequest, useRejectEditRequest } from '@/hooks/useQueries';
import { Card, LoadingSpinner, Button } from '@/components/common';

export default function HrEditRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  const requestId = Number(id || 0);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['edit-request', requestId],
    queryFn: () => editRequestAPI.getEditRequest(requestId),
    enabled: !!requestId,
  });

  const approve = useApproveEditRequest();
  const reject = useRejectEditRequest();
  const [rejectNotes, setRejectNotes] = useState('');

  const handleApprove = () => {
    if (!window.confirm('Approve this edit request?')) return;
    approve.mutate(requestId, { onSuccess: () => refetch() });
  };

  const handleReject = () => {
    if (!window.confirm('Reject this edit request?')) return;
    reject.mutate({ id: requestId, notes: rejectNotes }, { onSuccess: () => refetch() });
  };

  if (!requestId) return <div className="p-4 lg:p-6 lg:ml-64">Invalid request id</div>;

  return (
    <div className="p-4 lg:p-6 lg:ml-64">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Request</h1>
        <p className="text-sm text-gray-600">Review and act on a single edit request.</p>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-8 flex justify-center"><LoadingSpinner /></div>
        ) : !data ? (
          <div className="p-4">Request not found.</div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold">{data.employee_name || data.requested_by_name || 'Unknown'}</div>
              <div className="text-sm text-gray-500">Requested: {new Date(data.created_at).toLocaleString()}</div>
            </div>

            <div>
              <h4 className="font-medium">Requested Changes</h4>
              <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(data.changes || data.payload || data.details || {}, null, 2)}</pre>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Rejection Notes (optional)</label>
              <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} rows={3} className="w-full px-3 py-2 border rounded" />
            </div>

            <div className="flex gap-2">
              <Button variant="success" onClick={handleApprove}>Approve</Button>
              <Button variant="error" onClick={handleReject}>Reject</Button>
              <Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
