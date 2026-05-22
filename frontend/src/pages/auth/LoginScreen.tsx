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
    <div className="relative min-h-screen overflow-hidden bg-[#f6f8fc]">
      {/* MAIN BACKGROUND */}
      <div className="absolute inset-0">
        {/* TOP LIGHT */}
        <motion.div
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
          }}
          className="absolute -top-40 -left-32 h-[500px] w-[500px] rounded-full bg-red-100 blur-3xl"
        />

        {/* BOTTOM LIGHT */}
        <motion.div
          animate={{
            x: [0, -50, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
          }}
          className="absolute bottom-[-200px] right-[-100px] h-[500px] w-[500px] rounded-full bg-rose-100 blur-3xl"
        />

        {/* GRID */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* MAIN CONTAINER */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
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
            duration: 0.7,
          }}
          className="grid w-full max-w-6xl overflow-hidden rounded-[36px] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.08)] lg:grid-cols-2"
        >
          {/* LEFT SIDE */}
          <div className="hidden items-center justify-center bg-white p-10 lg:flex">
            <img
              src={logo3pl}
              alt="3PL Business Solutions"
              className="w-[370px] object-contain"
            />
          </div>

          {/* RIGHT SIDE */}
          <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-500 to-rose-500 px-8 py-12 sm:px-14 lg:px-16">
            {/* DESIGN CIRCLES */}
            <div className="absolute top-[-100px] right-[-100px] h-72 w-72 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute bottom-[-120px] left-[-120px] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            {/* MOBILE LOGO */}
            <div className="mb-10 flex justify-center lg:hidden">
              <img
                src={mobileLogoLogin}
                alt="Mobile Logo"
                className="w-[150px] object-contain"
              />
            </div>

            {/* CONTENT */}
            <motion.div
              initial={{
                opacity: 0,
                x: 30,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.7,
                delay: 0.2,
              }}
              className="relative z-10 mx-auto flex min-h-full w-full max-w-md flex-col justify-center"
            >
              {/* HEADER */}
              <div className="mb-10">
                <h1 className="text-center text-5xl font-black tracking-tight text-white">
                  Sign In
                </h1>

                <p className="mt-3 text-center text-sm font-medium text-red-100">
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
                  className="mb-5 rounded-2xl border border-white/20 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur-sm"
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
                <motion.div
                  whileFocus={{
                    scale: 1.01,
                  }}
                  className="group"
                >
                  <label className="mb-3 block text-sm font-semibold tracking-wide text-white">
                    Username
                  </label>

                  <div className="relative">
                    {/* GLOW */}
                    <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

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
                      className="relative h-14 w-full rounded-2xl border border-white/20 bg-white/95 px-5 text-base font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 focus:-translate-y-[2px] focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                    />
                  </div>
                </motion.div>

                {/* PASSWORD */}
                <motion.div
                  whileFocus={{
                    scale: 1.01,
                  }}
                  className="group"
                >
                  <label className="mb-3 block text-sm font-semibold tracking-wide text-white">
                    Password
                  </label>

                  <div className="relative">
                    {/* GLOW */}
                    <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

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
                      className="relative h-14 w-full rounded-2xl border border-white/20 bg-white/95 px-5 pr-14 text-base font-medium text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-300 focus:-translate-y-[2px] focus:border-white focus:bg-white focus:ring-4 focus:ring-white/20"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 transition-all duration-300 hover:scale-110 hover:text-red-500"
                    >
                      {showPassword ? (
                        <EyeOff size={22} />
                      ) : (
                        <Eye size={22} />
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* BUTTON */}
                <motion.button
                  whileHover={{
                    scale: 1.02,
                    y: -2,
                  }}
                  whileTap={{
                    scale: 0.98,
                  }}
                  type="submit"
                  disabled={
                    loginMutation.isPending
                  }
                  className="group relative mt-4 h-14 w-full overflow-hidden rounded-2xl bg-white text-base font-bold text-red-600 shadow-[0_18px_40px_rgba(255,255,255,0.18)] transition-all duration-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10">
                    {loginMutation.isPending
                      ? 'Signing In...'
                      : 'Login'}
                  </span>

                  {/* SHINE EFFECT */}
                  <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-red-100 to-transparent transition-transform duration-1000 group-hover:translate-x-[120%]" />
                </motion.button>
              </form>

              {/* FOOTER */}
              <div className="mt-10 text-center">
                <p className="text-xs tracking-wide text-red-100">
                  © 2026 3PL Business Solutions
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};