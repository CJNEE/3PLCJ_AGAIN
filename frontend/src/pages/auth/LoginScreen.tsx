import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
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

        const role =
          response.user?.role ||
          response.employee?.role;

        success(
          `Welcome back ${
            response.user?.username || ''
          }`
        );

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
    <div className="relative min-h-screen overflow-hidden bg-[#020817]">
      {/* BACKGROUND EFFECTS */}
      <div className="absolute inset-0">
        <div className="absolute top-[-120px] left-[-120px] h-[350px] w-[350px] rounded-full bg-red-600/20 blur-3xl" />

        <div className="absolute bottom-[-150px] right-[-100px] h-[350px] w-[350px] rounded-full bg-rose-500/20 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_40%)]" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 lg:p-8">
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
            duration: 0.6,
          }}
          className="grid w-full max-w-7xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#071129]/80 backdrop-blur-2xl shadow-[0_20px_100px_rgba(0,0,0,0.45)] lg:grid-cols-2"
        >
          {/* LEFT SIDE */}
          <div className="relative hidden items-center justify-center overflow-hidden bg-gradient-to-br from-red-700 via-red-600 to-rose-500 lg:flex">
            {/* Glow */}
            <div className="absolute top-20 left-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute bottom-20 right-20 h-52 w-52 rounded-full bg-white/10 blur-3xl" />

            {/* LOGO */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 5,
              }}
              className="relative z-10"
            >
              <img
                src={logo3pl}
                alt="3PL Logo"
                className="w-[420px] drop-shadow-[0_15px_40px_rgba(0,0,0,0.45)]"
              />
            </motion.div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-20">
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
              <div className="mb-10 flex justify-center lg:hidden">
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
                  className="w-[190px] drop-shadow-2xl"
                />
              </div>

              {/* LOGIN CARD */}
              <div className="rounded-[2rem] border border-white/10 bg-[#09152F]/90 p-8 shadow-[0_10px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                {/* HEADER */}
                <div className="mb-10 text-center">
                  <h1 className="bg-gradient-to-r from-red-500 to-rose-400 bg-clip-text text-5xl font-black tracking-tight text-transparent">
                    Sign In
                  </h1>

                  <p className="mt-3 text-sm text-gray-400">
                    Secure access to your dashboard
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
                    className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                  >
                    {loginError}
                  </motion.div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  {/* USERNAME */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-gray-200">
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
                      className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10 focus:ring-4 focus:ring-red-500/10"
                    />
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-gray-200">
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
                        className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 px-5 pr-14 text-white placeholder:text-gray-500 outline-none transition-all duration-300 focus:border-red-500 focus:bg-white/10 focus:ring-4 focus:ring-red-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            !showPassword
                          )
                        }
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 transition hover:text-red-400"
                      >
                        {showPassword ? (
                          <EyeOff size={22} />
                        ) : (
                          <Eye size={22} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* BUTTON */}
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
                    className="relative mt-3 h-14 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-red-500 to-rose-500 font-bold text-white shadow-[0_10px_30px_rgba(239,68,68,0.35)] transition-all duration-300 hover:shadow-[0_15px_40px_rgba(239,68,68,0.45)] disabled:cursor-not-allowed disabled:opacity-70"
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
                <div className="mt-10 text-center">
                  <p className="text-xs text-gray-500">
                    © 2026 3PL Business Solutions
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};