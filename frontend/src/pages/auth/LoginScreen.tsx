import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useQueries';
import { ErrorMessage } from '@/components/common';
import { useToast } from '@/hooks/useToast';
import { Eye, EyeOff } from 'lucide-react';
import logo3pl from '@/images/3pl1.png';
import { login } from "@/api";

export const LoginScreen = () => {
  const navigate = useNavigate();
  const { setUser, setToken, setIsAuthenticated, setEmployee } = useAuth();
  const loginMutation = useLogin();
  const { success, error } = useToast();
  
  const response = await login(username, password);
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

      if (response.token && response.user && response.employee) {
        // Store auth data
        localStorage.setItem('access_token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
        localStorage.setItem('currentEmployee', JSON.stringify(response.employee));

        setToken(response.token);
        setUser(response.user);
        setEmployee(response.employee);
        setIsAuthenticated(true);

        success(`Welcome back, ${response.user.username}!`);

        // Redirect based on role
        const role = response.user.role;
        if (role === 'Admin') {
          navigate('/admin');
        } else if (role === 'HR') {
          navigate('/hr');
        } else {
          navigate('/employee');
        }
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed. Please try again.';
      setLoginError(errorMessage);
      error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex">
        {/* Left Side - Logo */}
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
            <h1 className="text-4xl font-bold text-white text-center mb-8">LOGIN</h1>

            <form onSubmit={handleLogin} className="space-y-5">
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
