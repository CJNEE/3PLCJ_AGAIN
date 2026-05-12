import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LeaveRequestsPanel } from '@/components/LeaveRequestsPanel';

export default function HrLeaveRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  // Reuse existing LeaveRequestsPanel which handles fetching and actions.
  return <LeaveRequestsPanel initialFilter="pending" />;
}
