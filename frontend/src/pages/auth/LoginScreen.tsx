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
    <div className="relative min-h-screen overflow-hidden bg-[#f8f3f3]">
      {/* ================= BACKGROUND ================= */}
      <div className="absolute inset-0 overflow-hidden">
        {/* DESKTOP LEFT */}
        <div className="absolute left-0 top-0 hidden h-full w-[48%] bg-[#f8f3f3] lg:block" />

        {/* DESKTOP RIGHT */}
        <div className="absolute right-0 top-0 hidden h-full w-[58%] bg-gradient-to-br from-[#ff3d4d] via-[#ff1639] to-[#c4001c] lg:block">
          {/* TOP CIRCLES */}
          <div className="absolute right-[-120px] top-[-40px] h-[430px] w-[430px] rounded-full border border-white/10" />
          <div className="absolute right-[-80px] top-0 h-[360px] w-[360px] rounded-full border border-white/10" />
          <div className="absolute right-[-40px] top-[40px] h-[290px] w-[290px] rounded-full border border-white/10" />

          {/* GLOW */}
          <div className="absolute bottom-[-180px] left-[-100px] h-[420px] w-[600px] rounded-full bg-black/10 blur-3xl" />
        </div>

        {/* DESKTOP CENTER WAVE */}
        <div className="absolute left-[43%] top-0 hidden h-full w-[260px] -translate-x-1/2 lg:block">
          <svg
            viewBox="0 0 300 1000"
            preserveAspectRatio="none"
            className="h-full w-full"
          >
            <path
              d="M120,0 
                C280,180 30,320 170,520
                C310,700 90,860 210,1000
                L0,1000 L0,0 Z"
              fill="#f8f3f3"
            />
          </svg>
        </div>

        {/* MOBILE RED BG */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#ff3d4d] via-[#ff1639] to-[#d10024] lg:hidden" />

        {/* MOBILE TOP WHITE */}
        <div className="absolute left-0 top-0 h-[42%] w-full overflow-hidden rounded-b-[90px] bg-[#f8f3f3] lg:hidden">
          {/* CURVE */}
          <svg
            className="absolute bottom-[-1px] left-0"
            viewBox="0 0 500 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,20 C180,130 320,0 500,90 L500,120 L0,120 Z"
              fill="#ff1738"
            />
          </svg>
        </div>

        {/* MOBILE GLOW */}
        <div className="absolute bottom-[-120px] left-1/2 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-white/10 blur-3xl lg:hidden" />

        {/* DOTS */}
        <div className="absolute right-8 top-16 grid grid-cols-4 gap-3">
          {Array.from({ length: 16 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-red-400/70"
              />
            )
          )}
        </div>

        <div className="absolute bottom-32 left-10 grid grid-cols-4 gap-3 lg:hidden">
          {Array.from({ length: 16 }).map(
            (_, index) => (
              <div
                key={index}
                className="h-1.5 w-1.5 rounded-full bg-white/40"
              />
            )
          )}
        </div>

        {/* FLOATING LIGHTS */}
        <motion.div
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
          }}
          className="absolute right-10 top-10 h-20 w-20 rounded-full bg-white/10 blur-2xl"
        />

        <motion.div
          animate={{
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          className="absolute bottom-10 left-6 h-28 w-28 rounded-full bg-white/10 blur-3xl"
        />
      </div>

      {/* ================= MAIN ================= */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 sm:px-6 lg:px-10">
        <div className="grid w-full max-w-7xl items-center gap-10 lg:grid-cols-2">
          {/* ================= DESKTOP LOGO ================= */}
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
              className="w-[420px] object-contain"
            />
          </motion.div>

          {/* ================= FORM ================= */}
          <motion.div
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.8,
            }}
            className="mx-auto w-full max-w-[560px]"
          >
            {/* MOBILE STYLE CONTAINER */}
            <div className="relative overflow-hidden rounded-[40px] bg-transparent px-1 py-4 lg:bg-transparent">
              {/* MOBILE LOGO */}
              <div className="relative mb-10 flex justify-center lg:hidden">
                <img
                  src={mobileLogoLogin}
                  alt="3PL"
                  className="w-[220px] object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.15)]"
                />
              </div>

              {/* DESKTOP CARD */}
              <div className="hidden rounded-[42px] border border-white/10 bg-white/5 p-10 shadow-[0_25px_80px_rgba(0,0,0,0.15)] backdrop-blur-xl lg:block">
                <div className="flex justify-center">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                    }}
                    className="flex h-24 w-24 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl"
                  >
                    <Lock
                      size={34}
                      className="text-white"
                    />
                  </motion.div>
                </div>

                <div className="mt-8 text-center">
                  <h1 className="text-6xl font-black text-white">
                    Sign In
                  </h1>

                  <p className="mt-4 text-lg text-red-100">
                    Welcome back! Please login to continue
                  </p>

                  <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-white" />
                </div>

                {loginError && (
                  <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-white backdrop-blur-xl">
                    {loginError}
                  </div>
                )}

                <form
                  onSubmit={handleLogin}
                  className="mt-10 space-y-7"
                >
                  {/* USERNAME */}
                  <div>
                    <label className="mb-3 block text-base font-semibold text-white">
                      Username
                    </label>

                    <div className="group relative">
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                      <div className="relative flex h-[74px] items-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
                        <div className="flex h-full w-[78px] items-center justify-center border-r border-white/10">
                          <User
                            size={24}
                            className="text-white"
                          />
                        </div>

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
                          className="h-full w-full bg-transparent px-5 text-lg text-white placeholder:text-red-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-3 block text-base font-semibold text-white">
                      Password
                    </label>

                    <div className="group relative">
                      <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 blur-xl transition-all duration-500 group-focus-within:opacity-100" />

                      <div className="relative flex h-[74px] items-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl">
                        <div className="flex h-full w-[78px] items-center justify-center border-r border-white/10">
                          <Lock
                            size={24}
                            className="text-white"
                          />
                        </div>

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
                          className="h-full w-full bg-transparent px-5 text-lg text-white placeholder:text-red-100 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="mr-5 text-white transition-all duration-300 hover:scale-110"
                        >
                          {showPassword ? (
                            <EyeOff size={24} />
                          ) : (
                            <Eye size={24} />
                          )}
                        </button>
                      </div>
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
                    className="group relative flex h-[76px] w-full items-center justify-center overflow-hidden rounded-full bg-white text-xl font-bold text-red-600 shadow-[0_15px_40px_rgba(255,255,255,0.25)]"
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

                    <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-red-100 to-transparent transition-transform duration-1000 group-hover:translate-x-[120%]" />
                  </motion.button>
                </form>

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

              {/* ================= MOBILE UI ================= */}
              <div className="relative overflow-hidden rounded-[40px] bg-transparent px-2 pb-4 pt-2 lg:hidden">
                {/* LOCK */}
                <div className="flex justify-center">
                  <motion.div
                    animate={{
                      y: [0, -8, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                    }}
                    className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-xl"
                  >
                    <Lock
                      size={28}
                      className="text-white"
                    />
                  </motion.div>
                </div>

                {/* TITLE */}
                <div className="mt-6 text-center">
                  <h1 className="text-[52px] font-black leading-none tracking-tight text-white">
                    Sign In
                  </h1>

                  <p className="mt-4 text-base text-red-100">
                    Welcome back! Please login to continue
                  </p>

                  <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-white" />
                </div>

                {/* ERROR */}
                {loginError && (
                  <div className="mt-7 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white backdrop-blur-xl">
                    {loginError}
                  </div>
                )}

                {/* FORM */}
                <form
                  onSubmit={handleLogin}
                  className="mt-9 space-y-6"
                >
                  {/* USERNAME */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-white">
                      Username
                    </label>

                    <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-white/10 backdrop-blur-xl">
                      <div className="flex h-[68px] items-center">
                        <div className="flex h-full w-[70px] items-center justify-center border-r border-white/10">
                          <User
                            size={22}
                            className="text-white"
                          />
                        </div>

                        <input
                          type="text"
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
                          className="h-full w-full bg-transparent px-5 text-base text-white placeholder:text-red-100 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label className="mb-3 block text-sm font-semibold text-white">
                      Password
                    </label>

                    <div className="relative overflow-hidden rounded-[22px] border border-white/15 bg-white/10 backdrop-blur-xl">
                      <div className="flex h-[68px] items-center">
                        <div className="flex h-full w-[70px] items-center justify-center border-r border-white/10">
                          <Lock
                            size={22}
                            className="text-white"
                          />
                        </div>

                        <input
                          type={
                            showPassword
                              ? 'text'
                              : 'password'
                          }
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
                          className="h-full w-full bg-transparent px-5 text-base text-white placeholder:text-red-100 outline-none"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              !showPassword
                            )
                          }
                          className="mr-5 text-white"
                        >
                          {showPassword ? (
                            <EyeOff size={22} />
                          ) : (
                            <Eye size={22} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* BUTTON */}
                  <motion.button
                    whileTap={{
                      scale: 0.97,
                    }}
                    type="submit"
                    disabled={
                      loginMutation.isPending
                    }
                    className="group relative mt-2 flex h-[74px] w-full items-center justify-center overflow-hidden rounded-full bg-white text-[28px] font-black text-red-600 shadow-[0_15px_35px_rgba(255,255,255,0.2)]"
                  >
                    <span className="mr-4">
                      {loginMutation.isPending
                        ? 'Signing...'
                        : 'Login'}
                    </span>

                    <ArrowRight
                      size={30}
                      className="transition-all duration-300 group-active:translate-x-2"
                    />

                    <div className="absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-red-100 to-transparent transition-transform duration-1000 group-active:translate-x-[120%]" />
                  </motion.button>
                </form>

                {/* FOOTER */}
                <div className="mt-10 text-center">
                  <p className="text-xs text-red-100">
                    © 2026{' '}
                    <span className="font-bold text-white">
                      3PL Business Solutions
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};