import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { apiClient } from '@/api/apiService';
import { Card, Badge, LoadingSpinner } from './common';
import { Calendar, Clock, User, MessageSquare, Paperclip, Eye, Download, X, ChevronRight } from 'lucide-react';
import { AttachmentPreviewModal } from './AttachmentPreviewModal';

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
  const [previewFile, setPreviewFile] = useState<{ url: string; type: 'image' | 'pdf' | 'other' } | null>(null);

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
        if (list.length > 0 && !selected) {
          setSelected(list[0]);
        }
      } catch (e) {
        console.error(e);
        error('Failed to load leave history');
      } finally {
        setLoading(false);
      }
    };

    void fetcher();
  }, [isOpen, employee?.id]);

  const handlePreview = (url: string) => {
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    const isPdf = /\.pdf$/i.test(url);
    setPreviewFile({
      url,
      type: isImage ? 'image' : isPdf ? 'pdf' : 'other'
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Leave History" size="xl">
      <div className="flex flex-col md:flex-row h-[70vh] gap-0">
        {/* Sidebar - List of Requests */}
        <div className="w-full md:w-80 border-r dark:border-gray-800 overflow-y-auto bg-gray-50/50 dark:bg-gray-900/50">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <LoadingSpinner />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center p-12">
              <Calendar size={40} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No leave requests yet</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-gray-800">
              {items.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`w-full p-4 text-left transition-all hover:bg-white dark:hover:bg-gray-800 flex items-center justify-between group ${
                    selected?.id === r.id ? 'bg-white dark:bg-gray-800 border-l-4 border-red-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black uppercase text-gray-500">{r.leave_type}</span>
                      <Badge variant={getStatusVariant(r.status)} size="sm">{r.status}</Badge>
                    </div>
                    <p className="font-bold text-sm truncate">{new Date(r.start_date).toLocaleDateString()} - {new Date(r.end_date).toLocaleDateString()}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleString()}</p>
                  </div>
                  <ChevronRight size={16} className={`text-gray-300 transition-transform ${selected?.id === r.id ? 'translate-x-1 text-red-600' : ''}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main Content - Request Details */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-dark-bg p-6 lg:p-8">
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-4">
                <Paperclip size={32} />
              </div>
              <p className="font-medium">Select a request to view details</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Header Details */}
              <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                      {selected.leave_type}
                    </h2>
                    <Badge variant={getStatusVariant(selected.status)} className="font-black uppercase tracking-widest text-[10px] px-3">
                      {selected.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={16} className="text-red-600" />
                      {new Date(selected.start_date).toLocaleDateString()} → {new Date(selected.end_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 border-l dark:border-gray-800 pl-4">
                      <Clock size={16} className="text-red-600" />
                      Requested {new Date(selected.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Info */}
                <div className="space-y-6">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
                      <MessageSquare size={14} className="text-red-600" />
                      Reason for Leave
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                      "{selected.reason || 'No reason provided'}"
                    </p>
                  </div>

                  {selected.status !== 'pending' && (
                    <div className={`p-5 rounded-2xl border ${
                      selected.status === 'approved' 
                      ? 'bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20' 
                      : 'bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20'
                    }`}>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${
                        selected.status === 'approved' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <User size={14} />
                        Admin Feedback
                      </h4>
                      <p className="text-sm font-bold mb-2">
                        Reviewed by <span className="text-gray-900 dark:text-white underline decoration-red-600 decoration-2 underline-offset-4">{selected.reviewed_by_name || 'Administrator'}</span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-4 italic">
                        {selected.notes || 'No comments provided by administrator.'}
                      </p>
                      {selected.reviewed_at && (
                        <p className="text-[10px] text-gray-400 font-medium">
                          Date: {new Date(selected.reviewed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Attachments */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Paperclip size={14} className="text-red-600" />
                    Attachments ({selected.attachments?.length || 0})
                  </h4>
                  
                  {(!selected.attachments || selected.attachments.length === 0) ? (
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 border border-dashed border-gray-200 dark:border-gray-800 text-center">
                      <p className="text-xs text-gray-400">No files attached to this request</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {selected.attachments.map((url: string, idx: number) => {
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
                        return (
                          <div 
                            key={idx} 
                            className="group relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden aspect-square border border-gray-200 dark:border-gray-700 hover:border-red-500/50 transition-all duration-300"
                          >
                            {isImage ? (
                              <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                <Paperclip size={24} className="text-gray-400 mb-2" />
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter truncate w-full text-center">
                                  {url.split('/').pop()?.split('?')[0] || 'Document'}
                                </span>
                              </div>
                            )}
                            
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handlePreview(url)}
                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                              >
                                <Eye size={16} />
                              </button>
                              <a 
                                href={url} 
                                download 
                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40 transition-colors"
                              >
                                <Download size={16} />
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {previewFile && (
        <AttachmentPreviewModal
          url={previewFile.url}
          type={previewFile.type}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </Modal>
  );
};

export default EmployeeLeaveHistoryModal;
