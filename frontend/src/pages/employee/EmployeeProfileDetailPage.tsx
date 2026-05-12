import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card, Button, Badge, LoadingSpinner } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { Upload, Edit2, Save, X, Clock, Send, ArrowLeft } from 'lucide-react';
import { EditInfoRequestModal } from '@/components/EditInfoRequestModal';
import apiClient from '@/api/apiService';
import Sidebar from '@/components/Sidebar';
import { ThemeToggle } from '@/context/ThemeContext';

interface EmployeeData {
  id: number;
  firstname: string;
  lastname: string;
  middle_initial: string;
  place_of_birth: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  marital_status: string;
  email_address: string;
  phone_number: string;
  current_address: string;
  permanent_address: string;
  position: string;
  employment_type: string;
  status: string;
  role: string;
  hub: number;
  hub_name: string;
  hired_date: string;
  jtp_code: string;
  employee_id: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  tin: string;
  sss: string;
  philhealth: string;
  pagibig: string;
  profile_image: string;
  profile_image_url: string;
  documents: any[];
  can_login: boolean;
  can_edit_info: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  full_name: string;
  attendance_history?: any[];
}

const FIELD_CONFIG = {
  // Text inputs
  firstname: { label: 'First Name', type: 'text' },
  lastname: { label: 'Last Name', type: 'text' },
  middle_initial: { label: 'Middle Initial', type: 'text' },
  place_of_birth: { label: 'Place of Birth', type: 'text' },
  date_of_birth: { label: 'Date of Birth', type: 'date' },
  email_address: { label: 'Email Address', type: 'email' },
  phone_number: { label: 'Phone Number', type: 'tel' },
  current_address: { label: 'Current Address', type: 'textarea' },
  permanent_address: { label: 'Permanent Address', type: 'textarea' },
  hired_date: { label: 'Hired Date', type: 'date' },
  jtp_code: { label: 'JTP Code', type: 'text' },
  employee_id: { label: 'Employee ID', type: 'text', disabled: true },
  emergency_contact_name: { label: 'Emergency Contact Name', type: 'text' },
  emergency_contact_phone: { label: 'Emergency Contact Phone', type: 'tel' },
  tin: { label: 'TIN', type: 'text' },
  sss: { label: 'SSS', type: 'text' },
  philhealth: { label: 'Philhealth', type: 'text' },
  pagibig: { label: 'Pagibig', type: 'text' },

  // Dropdowns
  gender: { label: 'Gender', type: 'select', options: ['Male', 'Female', 'Other'] },
  nationality: { label: 'Nationality', type: 'select', options: ['Filipino', 'Foreign'] },
  marital_status: { label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Divorced', 'Widowed'] },
  position: { label: 'Position', type: 'text' },
  employment_type: { label: 'Employment Type', type: 'select', options: ['Full-time', 'OCW'] },
  status: { label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Resign', 'AWOL', 'Blacklist'], disabled: true },
  role: { label: 'Role', type: 'select', options: ['Employee', 'HR', 'Admin'] },
  can_login: { label: 'Can Login', type: 'checkbox' },
  can_edit_info: { label: 'Can Edit Info', type: 'checkbox' },
  is_active: { label: 'Is Active', type: 'checkbox' },
};

export const EmployeeProfileDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { success, error } = useToast();
  const { employee: currentEmployee } = useAuth();

  const showAdminSidebar =
    location.pathname.startsWith('/admin') || location.pathname.startsWith('/hr');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<EmployeeData>>({});
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [latestAttendance, setLatestAttendance] = useState<any>(null);
  const [showEditRequestModal, setShowEditRequestModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Check if current user is viewing their own profile
  const isOwnProfile = currentEmployee?.id === Number(id);

  // Fetch employee data
  useEffect(() => {
    if (id) {
      const fetchEmployee = async () => {
        try {
          setIsLoading(true);
          setHasError(false);
          
          const data = await apiClient.get(`/employees/${id}/`);
          console.log('Employee data:', data.data);
          setFormData(data.data);
        } catch (err) {
          console.error('Error fetching employee:', err);
          error('Failed to fetch employee details');
          setHasError(true);
        } finally {
          setIsLoading(false);
        }
      };

      const fetchLatestAttendance = async () => {
        try {
          const response = await apiClient.get(`/attendance/?employee_id=${id}&limit=1`);
          
          if (response.data?.results && response.data.results.length > 0) {
            setLatestAttendance(response.data.results[0]);
          }
        } catch (err) {
          console.error('Error fetching attendance:', err);
        }
      };

      fetchEmployee();
      fetchLatestAttendance();
    }
  }, [id, error]);



  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setProfileImage(e.target.files[0]);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files));
    }
  };

  const handleSave = async () => {
    try {
      // Prepare update data - only include fields that are editable
      const updateData: any = {};
      const editableFields = [
        'firstname', 'lastname', 'middle_initial', 'place_of_birth', 'date_of_birth',
        'gender', 'nationality', 'marital_status', 'email_address', 'phone_number',
        'current_address', 'permanent_address', 'position', 'employment_type',
        'status', 'role', 'hub', 'hired_date', 'jtp_code', 'employee_id',
        'emergency_contact_name', 'emergency_contact_phone', 'tin', 'sss',
        'philhealth', 'pagibig', 'can_login', 'can_edit_info'
      ];

      // Build update object with only editable fields
      editableFields.forEach(key => {
        const value = (formData as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          updateData[key] = value;
        }
      });

      // If profile image was changed, use FormData
      if (profileImage) {
        const formDataObj = new FormData();
        // Add all fields to FormData
        Object.entries(updateData).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formDataObj.append(key, String(value));
          }
        });
        // Add profile image
        formDataObj.append('profile_image', profileImage);

        const response = await apiClient.patch(`/employees/${id}/`, formDataObj);
      } else {
        // Use JSON for regular updates (no image)
        const response = await apiClient.patch(`/employees/${id}/`, updateData);
      }

      // Upload attachments separately
      if (attachments.length > 0) {
        for (const file of attachments) {
          const attachFormData = new FormData();
          attachFormData.append('file', file);
          attachFormData.append('employee', id || '');

          await apiClient.post('/employee-documents/', attachFormData);

        }
      }

      success('Employee details saved successfully');
      setIsEditing(false);
      setProfileImage(null);
      setAttachments([]);

      // Refresh data
      const updatedData = await apiClient.get(`/employees/${id}/`);
      setFormData(updatedData.data);
    } catch (err: any) {
      // Log detailed error info for debugging
      if (err.response?.data) {
        console.error('Validation errors:', err.response.data);
        error(`Failed to save: ${JSON.stringify(err.response.data)}`);
      } else {
        error('Failed to save employee details');
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      {showAdminSidebar && (
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
      )}
      <div className={`p-4 lg:p-6 space-y-6 ${showAdminSidebar ? 'lg:ml-64' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} className="mr-2" />
          Back
        </Button>
        {showAdminSidebar && <ThemeToggle />}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <Card>
          <div className="text-center text-red-600 dark:text-red-400">
            <p>Failed to load employee details. Please try again.</p>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              Reload Page
            </Button>
          </div>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !hasError && (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">{formData.full_name || 'Employee Profile'}</h1>
              <p className="text-gray-600 dark:text-gray-400">{formData.position}</p>
            </div>
            <div className="flex gap-2">
              {isOwnProfile && !isEditing && (
                <Button
                  variant="secondary"
                  onClick={() => setShowEditRequestModal(true)}
                >
                  <Send size={18} className="mr-2" />
                  Request Changes
                </Button>
              )}
              {!isEditing ? (
                <Button
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit2 size={18} className="mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSave}
                  >
                    <Save size={18} className="mr-2" />
                    Save
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    <X size={18} className="mr-2" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

      {/* Profile Image Section */}
      <Card>
        <div className="flex flex-col items-center">
          {formData.profile_image_url ? (
            <img
              src={formData.profile_image_url}
              alt={formData.full_name}
              className="w-40 h-40 rounded-lg object-cover mb-4"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-300 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
              <span className="text-gray-500">No Image</span>
            </div>
          )}
          {isEditing && (
            <div className="w-full">
              <label className="flex items-center gap-2 cursor-pointer">
                <Upload size={18} />
                <span>Change Profile Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      </Card>

      {/* Latest Clock In/Out */}
      {latestAttendance && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-primary" />
            <h3 className="text-lg font-semibold">Latest Clock In/Out</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Clock In Time</p>
              <p className="font-semibold">{latestAttendance.clock_in_time || 'Not clocked in'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Clock Out Time</p>
              <p className="font-semibold">{latestAttendance.clock_out_time || 'Not clocked out'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-semibold">{latestAttendance.date}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <Badge variant={latestAttendance.status === 'Present' ? 'success' : 'warning'}>
                {latestAttendance.status}
              </Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Personal Information Section */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['firstname', 'lastname', 'middle_initial', 'place_of_birth', 'date_of_birth', 'gender', 'nationality', 'marital_status'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || ''}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Contact Information */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['email_address', 'phone_number', 'current_address', 'permanent_address'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || ''}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Employment Information */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Employment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['position', 'employment_type', 'status', 'role', 'hired_date', 'jtp_code', 'employee_id'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || ''}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Emergency Contact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['emergency_contact_name', 'emergency_contact_phone'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || ''}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Government IDs */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Government IDs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['tin', 'sss', 'philhealth', 'pagibig'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || ''}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['can_login', 'can_edit_info', 'is_active'].map(field => (
            <FormField
              key={field}
              field={field}
              value={(formData as any)[field] || false}
              config={(FIELD_CONFIG as any)[field]}
              isEditing={isEditing}
              onChange={handleFieldChange}
            />
          ))}
        </div>
      </Card>

      {/* Timestamps */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Record Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Created At</p>
            <p className="font-semibold">{formData.created_at}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Updated At</p>
            <p className="font-semibold">{formData.updated_at}</p>
          </div>
        </div>
      </Card>

      {/* Attachments Section */}
      <Card>
        <h2 className="text-2xl font-bold mb-4">Attachments</h2>
        {formData.documents && formData.documents.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Existing Attachments</h3>
            <div className="space-y-2">
              {formData.documents.map((doc: any) => (
                <a
                  key={doc.id}
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {doc.file_name}
                </a>
              ))}
            </div>
          </div>
        )}
        {isEditing && (
          <div>
            <label className="flex items-center gap-2 cursor-pointer p-2 border border-dashed rounded">
              <Upload size={18} />
              <span>Add Attachments</span>
              <input
                type="file"
                multiple
                onChange={handleAttachmentChange}
                className="hidden"
              />
            </label>
            {attachments.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                {attachments.length} file(s) selected
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Edit Request Modal */}
      <EditInfoRequestModal
        employeeId={Number(id)}
        isOpen={showEditRequestModal}
        onClose={() => setShowEditRequestModal(false)}
      />
        </>
      )}
      </div>
    </div>
  );
};

interface FormFieldProps {
  field: string;
  value: any;
  config: any;
  isEditing: boolean;
  onChange: (field: string, value: any) => void;
}

const FormField = ({ field, value, config, isEditing, onChange }: FormFieldProps) => {
  if (!config) return null;

  const { label, type, options, disabled } = config;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
      {!isEditing || (disabled && !isEditing) ? (
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded">
          {type === 'checkbox' ? (
            <input type="checkbox" checked={value} disabled className="rounded" />
          ) : type === 'select' ? (
            <p>{value}</p>
          ) : type === 'textarea' ? (
            <p className="whitespace-pre-wrap">{value}</p>
          ) : (
            <p>{value}</p>
          )}
        </div>
      ) : (
        <>
          {type === 'text' && (
            <input
              type="text"
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          )}
          {type === 'email' && (
            <input
              type="email"
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          )}
          {type === 'tel' && (
            <input
              type="tel"
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          )}
          {type === 'date' && (
            <input
              type="date"
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            />
          )}
          {type === 'textarea' && (
            <textarea
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
              rows={3}
            />
          )}
          {type === 'select' && (
            <select
              value={value || ''}
              onChange={e => onChange(field, e.target.value)}
              className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="">Select {label}</option>
              {options.map((opt: string) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {type === 'checkbox' && (
            <input
              type="checkbox"
              checked={value || false}
              onChange={e => onChange(field, e.target.checked)}
              className="rounded"
            />
          )}
        </>
      )}
    </div>
  );
};
