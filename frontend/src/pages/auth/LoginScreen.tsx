import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useQueries';
import { ErrorMessage } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';
import logo3pl from '@/images/3pl1.png';

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setIsAuthenticated, setEmployee } = useAuth();
  const loginMutation = useLogin();
  const { success, error } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!username || !password) {
      setLoginError('Please enter both username and password');
      return;
    }

    try {
      const response = await loginMutation.mutateAsync({
        username,
        password,
      });

      console.log('Login response:', response);

      // Treat successful login as authenticated as long as token exists
      if (response?.token) {
        localStorage.setItem('access_token', response.token);
        if (response?.user) localStorage.setItem('currentUser', JSON.stringify(response.user));
        if (response?.employee) localStorage.setItem('currentEmployee', JSON.stringify(response.employee));

        // Ensure user object has role
        const userWithRole = response?.user ? { ...response.user, role: response.user.role || response?.employee?.role } : null;
        
        console.log('User role:', userWithRole?.role);
        console.log('Employee role:', response?.employee?.role);
        
        setToken(response.token);
        setUser(userWithRole);
        setEmployee(response?.employee ?? null);
        setIsAuthenticated(true);

        const username = response?.user?.username ?? 'User';
        success(`Welcome back, ${username}!`);

        const role = response?.user?.role || response?.employee?.role;
        console.log('Navigating with role:', role);
        
        if (role === 'Admin') {
          console.log('Navigating to /admin');
          navigate('/admin', { replace: true });
        } else if (role === 'HR') {
          console.log('Navigating to /hr');
          navigate('/hr', { replace: true });
        } else if (role === 'Employee') {
          console.log('Navigating to /employee');
          navigate('/employee', { replace: true });
        } else {
          console.log('No role match, navigating to /admin');
          navigate('/admin', { replace: true });
        }
      } else {
        console.error('No token in response:', response);
        setLoginError('Login failed: No token received');
      }
      }
    } catch (err: any) {
      const data = err.response?.data;
      const errorMessage =
        (typeof data?.error === 'string' && data.error) ||
        (typeof data?.detail === 'string' && data.detail) ||
        (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) ||
        err.message ||
        'Login failed. Please try again.';
      setLoginError(errorMessage);
      error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Logo (desktop) */}
        <div className="hidden md:flex w-1/2 bg-white items-center justify-center p-8">
          <img 
            src={logo3pl} 
            alt="3PL Business Solutions" 
            className="max-w-xs h-auto object-contain"
          />
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 bg-red-700 flex flex-col items-center justify-center p-8 md:p-12">
          <div className="w-full max-w-sm">
            {/* Mobile logo — same asset as desktop */}
            <div className="flex md:hidden justify-center mb-6">
              <img
                src={logo3pl}
                alt="3PL Business Solutions"
                className="max-w-[200px] h-auto object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-white text-center mb-8">LOGIN</h1>

            <form onSubmit={handleLogin} className="space-y-5" autoComplete="on">
              {loginError && (
                <div className="bg-red-900 border border-red-500 text-white px-4 py-3 rounded">
                  {loginError}
                </div>
              )}

              {/* Username */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Username:</label>
                <input
                  type="text"
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder=""
                  className="w-full px-4 py-3 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white"
                  disabled={loginMutation.isPending}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">Password:</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder=""
                    className="w-full px-4 py-3 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white pr-12"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full mt-8 px-6 py-3 bg-white text-red-700 font-semibold rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loginMutation.isPending ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
