import { Modal } from './Modal';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const EmployeeLeaveHistoryModal = ({ isOpen, onClose }: Props) => {
  const { employee } = useAuth();
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    if (!employee?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    const fetcher = async () => {
      try {
        setLoading(true);
        const res = await apiClient.get('/leave-requests/', {
          params: { employee_id: employee.id },
        });
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.results ?? [];
        setItems(list);
      } catch (e) {
        console.error(e);
        error('Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    void fetcher();
  }, [isOpen, employee?.id]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Leave History" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh]">
        <div className="md:col-span-1 space-y-3 overflow-y-auto">
          {loading && <p className="text-sm text-gray-500">Loading...</p>}
          {!loading && items.length === 0 && <p className="text-sm text-gray-500">No leave history found.</p>}

          {items.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelected(r); setSelectedAttachmentIndex(0); }}
              className={`w-full text-left border rounded p-3 hover:shadow-md transition ${selected?.id === r.id ? 'ring-2 ring-offset-1 ring-blue-400 bg-white/5' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
                  <p className="font-semibold">{r.leave_type} • {r.start_date} → {r.end_date}</p>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{r.reason || 'No reason provided'}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className={`text-sm font-medium ${r.status === 'approved' ? 'text-green-500' : r.status === 'rejected' ? 'text-red-400' : 'text-yellow-500'}`}>{r.status}</span>
                  <span className="text-xs text-gray-400">{r.days || ''} days</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 border rounded p-4 flex flex-col">
          {!selected && (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-500">Select a leave entry to view receipt and details.</div>
          )}

          {selected && (
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <div className="md:w-1/2">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold">{selected.leave_type}</h3>
                    <p className="text-sm text-gray-400">{selected.start_date} → {selected.end_date}</p>
                    <p className="text-sm text-gray-500 mt-2">{selected.reason || 'No reason provided'}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${selected.status === 'approved' ? 'bg-green-50 text-green-700' : selected.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{selected.status}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-gray-400">Requested on {new Date(selected.created_at).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Requested by: {selected.requested_by_name || employee?.full_name || employee?.email}</p>
                  {selected.reviewed_at && (
                    <p className="text-xs text-gray-400">Reviewed on {new Date(selected.reviewed_at).toLocaleString()}</p>
                  )}
                  {selected.reviewed_by_name && (
                    <p className="text-sm text-gray-600">Reviewed by: {selected.reviewed_by_name}</p>
                  )}
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-1">{selected.status === 'rejected' ? 'Rejection Note' : 'Admin Note'}</h4>
                    <p className="text-sm text-gray-500">{selected.notes ? selected.notes : (selected.status === 'rejected' ? 'No rejection note' : 'No admin note')}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Attachments</h4>
                  {(!selected.attachments || selected.attachments.length === 0) && <p className="text-sm text-gray-500">No attachments</p>}

                  {selected.attachments && selected.attachments.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2 overflow-x-auto">
                        {selected.attachments.map((a: string, idx: number) => (
                          <button
                            key={a}
                            onClick={() => setSelectedAttachmentIndex(idx)}
                            className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden border ${selectedAttachmentIndex === idx ? 'ring-2 ring-blue-400' : ''}`}
                          >
                            {/(jpg|jpeg|png|gif|webp)$/i.test(a) ? (
                              // thumbnail image
                              // eslint-disable-next-line jsx-a11y/img-redundant-alt
                              <img src={a} alt={`attachment-${idx}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-xs text-gray-600">File</div>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <a href={selected.attachments[selectedAttachmentIndex]} target="_blank" rel="noreferrer" className="px-3 py-2 bg-blue-600 text-white rounded text-sm">Open</a>
                        <a href={selected.attachments[selectedAttachmentIndex]} download className="px-3 py-2 border rounded text-sm">Download</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="md:w-1/2 flex-1 border rounded p-2 flex items-center justify-center bg-white/5">
                {selected.attachments && selected.attachments.length > 0 ? (
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(selected.attachments[selectedAttachmentIndex]) ? (
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={selected.attachments[selectedAttachmentIndex]} alt="receipt" className="max-h-[55vh] w-auto object-contain" />
                  ) : /\.(pdf)$/i.test(selected.attachments[selectedAttachmentIndex]) ? (
                    <iframe src={selected.attachments[selectedAttachmentIndex]} title="attachment-preview" className="w-full h-[55vh]" />
                  ) : (
                    <div className="text-sm text-gray-500">Cannot preview this file type. Use Open/Download links.</div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">No attachment selected.</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeLeaveHistoryModal;
