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
    <div className="relative min-h-screen overflow-hidden bg-[#fdf8f8]">
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 overflow-hidden">
        {/* LEFT BG */}
        <div className="absolute left-0 top-0 h-full w-full bg-[#fdf8f8]" />

        {/* RIGHT RED PANEL */}
        <div className="absolute right-0 top-0 hidden h-full w-[58%] overflow-hidden bg-gradient-to-br from-[#ff4040] via-[#f21832] to-[#c4001c] lg:block">
          {/* WAVES */}
          <div className="absolute right-[-120px] top-[-50px] h-[450px] w-[450px] rounded-full border border-white/10" />
          <div className="absolute right-[-80px] top-[-10px] h-[380px] w-[380px] rounded-full border border-white/10" />
          <div className="absolute right-[-40px] top-[30px] h-[310px] w-[310px] rounded-full border border-white/10" />

          {/* BOTTOM WAVES */}
          <div className="absolute bottom-[-180px] left-[-120px] h-[400px] w-[700px] rounded-[100%] bg-black/10 blur-2xl" />

          {/* DOTS */}
          <div className="absolute bottom-10 right-10 grid grid-cols-5 gap-3">
            {Array.from({ length: 25 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="h-1.5 w-1.5 rounded-full bg-white/50"
                />
              )
            )}
          </div>

          {/* FLOATING */}
          <motion.div
            animate={{
              y: [0, -20, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
            }}
            className="absolute right-16 top-10 h-16 w-16 rounded-full bg-white/10 blur-sm"
          />

          <motion.div
            animate={{
              y: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
            }}
            className="absolute left-16 bottom-16 h-28 w-28 rounded-full bg-white/10 blur-xl"
          />
        </div>

        {/* CENTER WAVE */}
        <div className="absolute left-[45%] top-0 hidden h-full w-[240px] -translate-x-1/2 lg:block">
          <svg
            viewBox="0 0 300 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M130,0 
                C280,180 20,330 170,520
                C320,710 80,860 200,1000
                L0,1000 L0,0 Z"
              fill="#fdf8f8"
            />
          </svg>
        </div>

        {/* LEFT DECOR */}
        <div className="absolute left-[5%] top-[8%] h-[140px] w-[140px] rounded-full bg-red-100/70 blur-2xl" />

        <div className="absolute bottom-[-80px] left-[-80px] h-[260px] w-[260px] rounded-full bg-red-100/70 blur-3xl" />

        {/* LEFT TOP LINES */}
        <svg
          className="absolute left-[12%] top-0 hidden opacity-40 lg:block"
          width="520"
          height="320"
          viewBox="0 0 520 320"
          fill="none"
        >
          <path
            d="M0 0C180 100 120 250 520 320"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
          <path
            d="M0 0C160 80 100 220 500 300"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
          <path
            d="M0 0C140 60 80 200 470 280"
            stroke="#f6c8c8"
            strokeWidth="1"
          />
        </svg>

        {/* DOTS LEFT */}
        <div className="absolute left-[28%] top-[10%] hidden grid-cols-4 gap-4 lg:grid">
          {Array.from({ length: 16 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400"
              />
            )
          )}
        </div>

        <div className="absolute bottom-[14%] left-[24%] hidden grid-cols-4 gap-4 lg:grid">
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

      {/* ================= MAIN ================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-8 lg:px-10">
        <div className="grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
          {/* ================= LEFT ================= */}
          <motion.div
            initial={{
              opacity: 0,
              x: -40,
            }}
            animate={{
              opacity: 1,
              x: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="hidden justify-center lg:flex"
          >
            <img
              src={logo3pl}
              alt="3PL"
              className="w-[430px] object-contain drop-shadow-[0_10px_40px_rgba(255,0,0,0.1)]"
            />
          </motion.div>

          {/* ================= RIGHT ================= */}
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
              duration: 0.9,
            }}
            className="mx-auto w-full max-w-[560px]"
          >
            {/* MOBILE CONTAINER */}
            <div className="rounded-[38px] bg-gradient-to-br from-[#ff4040] via-[#f21832] to-[#c4001c] px-6 py-10 shadow-[0_20px_80px_rgba(255,0,0,0.25)] lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none">
              {/* MOBILE LOGO */}
              <div className="mb-8 flex justify-center lg:hidden">
                <img
                  src={mobileLogoLogin}
                  alt="3PL"
                  className="w-[180px] object-contain"
                />
              </div>

              {/* LOCK */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
                className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md"
              >
                <Lock
                  size={34}
                  className="text-white"
                />
              </motion.div>

              {/* TITLE */}
              <div className="mt-8 text-center">
                <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                  Sign In
                </h1>

                <p className="mt-4 text-base text-red-100 sm:text-lg">
                  Welcome back! Please login to continue
                </p>

                <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-white" />
              </div>

              {/* ERROR */}
              {loginError && (
                <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-white backdrop-blur-md">
                  {loginError}
                </div>
              )}

              {/* FORM */}
              <form
                onSubmit={handleLogin}
                className="mt-10 space-y-7"
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

                    <div className="relative flex h-[74px] items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md transition-all duration-300 focus-within:border-white focus-within:bg-white/15">
                      <User
                        size={23}
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

                    <div className="relative flex h-[74px] items-center rounded-2xl border border-white/20 bg-white/10 px-5 backdrop-blur-md transition-all duration-300 focus-within:border-white focus-within:bg-white/15">
                      <Lock
                        size={23}
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
                  className="group relative mt-4 flex h-[76px] w-full items-center justify-center overflow-hidden rounded-full bg-white text-xl font-bold text-red-600 shadow-[0_12px_35px_rgba(255,255,255,0.25)] transition-all duration-300 hover:bg-red-50"
                >
                  <span className="mr-4">
                    {loginMutation.isPending
                      ? 'Signing In...'
                      : 'Login'}
                  </span>

                  <ArrowRight
                    size={28}
                    className="transition-all duration-300 group-hover:translate-x-2"
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
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};