import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function HrPayslipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'Admin') navigate('/', { replace: true });
  }, [user, navigate]);

  return (
    <div className="p-4 lg:p-6 lg:ml-64">
      <h1 className="text-2xl font-bold">HR — Payslips</h1>
      <p className="text-sm text-gray-600">Generate and manage payslips for employees.</p>
    </div>
  );
}
