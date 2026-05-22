import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useLogin } from '@/hooks/useQueries';
import { useToast } from '@/hooks/useToast';

import logo3pl from '@/images/3pl1.png';
import mobileLogoLogin from '@/images/MOBILELOGOLOGIN.png';

export const LoginScreen = () => {
  const navigate = useNavigate();

  const {
    setUser,
    setToken,
    setIsAuthenticated,
    setEmployee,
  } = useAuth();

  const loginMutation = useLogin();

  const { success, error } = useToast();

  const [username, setUsername] =
    useState<string>('');

  const [password, setPassword] =
    useState<string>('');

  const [showPassword, setShowPassword] =
    useState<boolean>(false);

  const [loginError, setLoginError] =
    useState<string | null>(null);

  const handleLogin = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoginError(null);

    if (!username || !password) {
      setLoginError(
        'Please enter both username and password'
      );
      return;
    }

    try {
      const response =
        await loginMutation.mutateAsync({
          username,
          password,
        });

      if (response?.token) {
        localStorage.setItem(
          'access_token',
          response.token
        );

        if (response?.user) {
          localStorage.setItem(
            'currentUser',
            JSON.stringify(response.user)
          );
        }

        if (response?.employee) {
          localStorage.setItem(
            'currentEmployee',
            JSON.stringify(response.employee)
          );
        }

        const userWithRole = response?.user
          ? {
              ...response.user,
              role:
                response.user.role ||
                response.employee?.role,
            }
          : null;

        setToken(response.token);
        setUser(userWithRole);
        setEmployee(response.employee ?? null);
        setIsAuthenticated(true);

        success(
          `Welcome back ${
            response.user?.username || ''
          }`
        );

        const role =
          response.user?.role ||
          response.employee?.role;

        if (role === 'Admin') {
          navigate('/admin', {
            replace: true,
          });
        } else if (role === 'HR') {
          navigate('/hr', {
            replace: true,
          });
        } else if (role === 'Employee') {
          navigate('/employee', {
            replace: true,
          });
        } else {
          navigate('/admin', {
            replace: true,
          });
        }
      } else {
        setLoginError(
          'Login failed: No token received'
        );
      }
    } catch (err: unknown) {
      let errorMessage =
        'Login failed. Please try again.';

      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err
      ) {
        const errorObj = err as {
          response?: {
            data?: {
              error?: string;
              detail?: string;
              non_field_errors?: string[];
            };
          };
        };

        const data = errorObj.response?.data;

        errorMessage =
          data?.error ||
          data?.detail ||
          data?.non_field_errors?.[0] ||
          errorMessage;
      }

      setLoginError(errorMessage);
      error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex items-center justify-center p-4">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.5,
        }}
        className="w-full max-w-6xl overflow-hidden rounded-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]"
      >
        <div className="grid lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="hidden lg:flex items-center justify-center bg-white p-10 border-r border-gray-100">
            <img
              src={logo3pl}
              alt="3PL Business Solutions"
              className="w-[340px] object-contain"
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-red-600 to-red-500 px-6 py-12 sm:px-10">
            {/* MOBILE LOGO */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden">
              <img
                src={mobileLogoLogin}
                alt="Mobile Logo"
                className="w-[130px] object-contain"
              />
            </div>

            {/* FORM CARD */}
            <motion.div
              initial={{
                opacity: 0,
                x: 20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.6,
                delay: 0.2,
              }}
              className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl sm:p-10"
            >
              {/* HEADER */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">
                  Sign In
                </h1>

                <p className="mt-2 text-sm text-gray-500">
                  Access your dashboard securely
                </p>
              </div>

              {/* ERROR */}
              {loginError && (
                <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {loginError}
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >
                {/* USERNAME */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Username
                  </label>

                  <input
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={username}
                    onChange={(e) =>
                      setUsername(
                        e.target.value
                      )
                    }
                    placeholder="Enter your username"
                    disabled={
                      loginMutation.isPending
                    }
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Password
                  </label>

                  <div className="relative">
                    <input
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      placeholder="Enter your password"
                      disabled={
                        loginMutation.isPending
                      }
                      className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 pr-12 text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-red-500"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* BUTTON */}
                <motion.button
                  whileHover={{
                    scale: 1.01,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  type="submit"
                  disabled={
                    loginMutation.isPending
                  }
                  className="mt-3 h-14 w-full rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-base font-bold text-white shadow-lg shadow-red-200 transition-all duration-300 hover:from-red-500 hover:to-red-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loginMutation.isPending
                    ? 'Signing In...'
                    : 'Login'}
                </motion.button>
              </form>

              {/* FOOTER */}
              <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">
                  © 2026 3PL Business Solutions
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};