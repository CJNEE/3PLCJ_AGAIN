import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

        const loggedUsername =
          response.user?.username || 'User';

        success(
          `Welcome back, ${loggedUsername}!`
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-red-100 via-rose-100 to-red-200 dark:from-[#070B14] dark:via-[#0B1120] dark:to-[#111827] transition-all duration-500">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-red-400/30 blur-3xl animate-pulse" />

      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-pink-300/20 blur-3xl animate-pulse" />

      {/* MAIN */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
        <motion.div
          initial={{
            opacity: 0,
            y: 30,
            scale: 0.98,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          transition={{
            duration: 0.7,
          }}
          className="w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 shadow-[0_20px_80px_rgba(0,0,0,0.15)] backdrop-blur-xl dark:bg-[#0F172A]/80"
        >
          <div className="grid min-h-[700px] grid-cols-1 lg:grid-cols-2">
            {/* LEFT SIDE */}
            <div className="relative hidden overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-rose-500 lg:flex flex-col items-center justify-center p-14">
              <div className="absolute top-10 left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

              <div className="absolute bottom-10 right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

              <motion.img
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                }}
                src={logo3pl}
                alt="3PL Logo"
                className="relative z-10 w-[320px] drop-shadow-2xl"
              />

              <div className="relative z-10 mt-10 text-center text-white">
                <h1 className="text-5xl font-black leading-tight">
                  Welcome Back
                </h1>

                <p className="mt-5 max-w-md text-lg leading-relaxed text-red-100">
                  Access your employee management
                  dashboard with a modern premium
                  experience.
                </p>

                <div className="mt-10 flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
                    <ShieldCheck size={18} />

                    <span className="text-sm font-medium">
                      Secure
                    </span>
                  </div>

                  <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-md">
                    <Sparkles size={18} />

                    <span className="text-sm font-medium">
                      Premium UI
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
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
                  delay: 0.2,
                  duration: 0.6,
                }}
                className="w-full max-w-md"
              >
                {/* MOBILE LOGO */}
                <div className="mb-8 flex justify-center lg:hidden">
                  <motion.img
                    animate={{
                      y: [0, -6, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                    }}
                    src={mobileLogoLogin}
                    alt="Mobile Logo"
                    className="w-[180px] drop-shadow-xl"
                  />
                </div>

                {/* LOGIN CARD */}
                <div className="rounded-[2rem] border border-red-100 bg-white/90 p-8 shadow-[0_10px_50px_rgba(0,0,0,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/90">
                  {/* HEADER */}
                  <div className="mb-8 text-center">
                    <h2 className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-4xl font-black text-transparent">
                      Sign In
                    </h2>

                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                      Login to continue
                    </p>
                  </div>

                  {/* ERROR */}
                  {loginError && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                    >
                      {loginError}
                    </motion.div>
                  )}

                  {/* FORM */}
                  <form
                    onSubmit={handleLogin}
                    className="space-y-6"
                    autoComplete="on"
                  >
                    {/* USERNAME */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
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
                        className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-[#1F2937] dark:text-white dark:focus:ring-red-500/20"
                      />
                    </div>

                    {/* PASSWORD */}
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
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
                          className="h-14 w-full rounded-2xl border border-gray-200 bg-gray-50 px-5 pr-14 text-gray-900 transition-all duration-300 placeholder:text-gray-400 focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-[#1F2937] dark:text-white dark:focus:ring-red-500/20"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-red-500"
                        >
                          {showPassword ? (
                            <EyeOff size={22} />
                          ) : (
                            <Eye size={22} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* LOGIN BUTTON */}
                    <motion.button
                      whileHover={{
                        scale: 1.02,
                      }}
                      whileTap={{
                        scale: 0.98,
                      }}
                      type="submit"
                      disabled={
                        loginMutation.isPending
                      }
                      className="relative h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-500 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-red-300/40 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      <span className="relative z-10">
                        {loginMutation.isPending
                          ? 'Signing In...'
                          : 'Login'}
                      </span>

                      <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 hover:translate-x-[100%]" />
                    </motion.button>
                  </form>

                  {/* FOOTER */}
                  <div className="mt-8 text-center">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      © 2026 3PL Business Solutions
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};