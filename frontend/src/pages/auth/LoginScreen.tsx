import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ArrowRight,
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
    <div className="relative min-h-screen overflow-hidden bg-[#f8f4f4]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        {/* LEFT TOP CIRCLE */}
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          className="absolute left-[-80px] top-[-80px] h-[240px] w-[240px] rounded-full bg-red-100 blur-2xl"
        />

        {/* LEFT BOTTOM */}
        <motion.div
          animate={{
            y: [0, 25, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
          }}
          className="absolute bottom-[-140px] left-[-140px] h-[320px] w-[320px] rounded-full bg-red-100 blur-3xl"
        />

        {/* RED RIGHT SIDE */}
        <div className="absolute right-0 top-0 h-full w-full lg:w-[58%] overflow-hidden bg-gradient-to-br from-[#ff2d2d] via-[#f21d2f] to-[#c40018]">
          {/* WAVES */}
          <div className="absolute right-[-200px] top-[-100px] h-[600px] w-[600px] rounded-full border border-white/10" />
          <div className="absolute right-[-160px] top-[-60px] h-[520px] w-[520px] rounded-full border border-white/10" />
          <div className="absolute right-[-120px] top-[-20px] h-[440px] w-[440px] rounded-full border border-white/10" />

          {/* BOTTOM WAVE */}
          <div className="absolute bottom-[-140px] left-[-60px] h-[320px] w-[700px] rounded-[100%] bg-black/10 blur-2xl" />

          {/* WHITE CURVE */}
          <div className="absolute left-[-120px] top-0 hidden h-full w-[240px] rounded-r-[100px] bg-[#f8f4f4] lg:block" />
        </div>

        {/* DOTS */}
        <div className="absolute left-[28%] top-[12%] grid grid-cols-4 gap-4">
          {Array.from({ length: 16 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400"
              />
            )
          )}
        </div>

        <div className="absolute bottom-[14%] left-[24%] grid grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400"
              />
            )
          )}
        </div>
      </div>

      {/* MAIN */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <div className="grid w-full max-w-7xl items-center lg:grid-cols-2">
          {/* LEFT SIDE */}
          <motion.div
            initial={{
              opacity: 0,
              x: -30,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.7,
            }}
            className="hidden items-center justify-center lg:flex"
          >
            <img
              src={logo3pl}
              alt="3PL Business Solutions"
              className="w-[440px] object-contain"
            />
          </motion.div>

          {/* RIGHT SIDE */}
          <motion.div
            initial={{
              opacity: 0,
              x: 40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="relative mx-auto w-full max-w-xl lg:ml-auto"
          >
            {/* MOBILE LOGO */}
            <div className="mb-8 flex justify-center lg:hidden">
              <img
                src={mobileLogoLogin}
                alt="Mobile Logo"
                className="w-[160px]"
              />
            </div>

            {/* LOCK ICON */}
            <motion.div
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
            >
              <Lock
                size={36}
                className="text-white"
              />
            </motion.div>

            {/* TITLE */}
            <div className="mb-10 text-center">
              <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                Sign In
              </h1>

              <p className="mt-4 text-lg text-red-100">
                Welcome back! Please login to continue
              </p>

              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-white" />
            </div>

            {/* ERROR */}
            {loginError && (
              <div className="mb-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-md">
                {loginError}
              </div>
            )}

            {/* FORM */}
            <form
              onSubmit={handleLogin}
              className="space-y-7"
            >
              {/* USERNAME */}
              <div>
                <label className="mb-3 block text-base font-semibold text-white">
                  Username
                </label>

                <motion.div
                  whileFocus={{
                    scale: 1.01,
                  }}
                  className="group relative"
                >
                  {/* GLOW */}
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                  <div className="relative flex h-16 items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md transition-all duration-300 focus-within:border-white focus-within:bg-white/15">
                    <User
                      size={22}
                      className="mr-4 text-white"
                    />

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
                      className="h-full w-full bg-transparent text-lg text-white placeholder:text-red-100 outline-none"
                    />
                  </div>
                </motion.div>
              </div>

              {/* PASSWORD */}
              <div>
                <label className="mb-3 block text-base font-semibold text-white">
                  Password
                </label>

                <motion.div
                  whileFocus={{
                    scale: 1.01,
                  }}
                  className="group relative"
                >
                  {/* GLOW */}
                  <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                  <div className="relative flex h-16 items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md transition-all duration-300 focus-within:border-white focus-within:bg-white/15">
                    <Lock
                      size={22}
                      className="mr-4 text-white"
                    />

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
                      className="h-full w-full bg-transparent text-lg text-white placeholder:text-red-100 outline-none"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="text-white transition-all duration-300 hover:scale-110"
                    >
                      {showPassword ? (
                        <EyeOff size={24} />
                      ) : (
                        <Eye size={24} />
                      )}
                    </button>
                  </div>
                </motion.div>
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
                className="group relative mt-4 flex h-16 w-full items-center justify-center overflow-hidden rounded-full bg-white text-xl font-bold text-red-600 shadow-[0_15px_40px_rgba(255,255,255,0.2)] transition-all duration-300 hover:bg-red-50"
              >
                <span className="mr-3">
                  {loginMutation.isPending
                    ? 'Signing In...'
                    : 'Login'}
                </span>

                <ArrowRight
                  size={26}
                  className="transition-all duration-300 group-hover:translate-x-1"
                />

                {/* SHINE */}
                <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-red-100 to-transparent transition-transform duration-1000 group-hover:translate-x-[120%]" />
              </motion.button>
            </form>

            {/* FOOTER */}
            <div className="mt-10 text-center">
              <p className="text-sm text-red-100">
                © 2026{' '}
                <span className="font-bold text-white">
                  3PL Business Solutions
                </span>
                . All rights reserved.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};