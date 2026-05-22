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
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6fb]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-red-100 blur-3xl opacity-60" />

        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-rose-100 blur-3xl opacity-60" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.4)_1px,transparent_1px)] bg-[size:70px_70px]" />
      </div>

      {/* MAIN */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.96,
            y: 20,
          }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
          }}
          transition={{
            duration: 0.7,
          }}
          className="grid w-full max-w-7xl overflow-hidden rounded-[40px] border border-white/70 bg-white/70 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl lg:grid-cols-2"
        >
          {/* LEFT SIDE */}
          <div className="relative hidden min-h-[760px] items-center justify-center overflow-hidden bg-white lg:flex">
            {/* LIGHT EFFECTS */}
            <div className="absolute top-16 left-16 h-52 w-52 rounded-full bg-red-100 blur-3xl opacity-70" />

            <div className="absolute bottom-16 right-16 h-52 w-52 rounded-full bg-pink-100 blur-3xl opacity-70" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_40%)]" />

            {/* LOGO */}
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
              }}
              className="relative z-10"
            >
              <img
                src={logo3pl}
                alt="3PL Logo"
                className="w-[480px] object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.08)]"
              />
            </motion.div>
          </div>

          {/* RIGHT SIDE */}
          <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-[#ff2e2e] via-[#ff4545] to-[#ff6b81] px-6 py-10 sm:px-10 lg:min-h-[760px] lg:px-20">
            {/* GLOW EFFECTS */}
            <div className="absolute top-[-120px] right-[-120px] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            <div className="absolute bottom-[-120px] left-[-120px] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

            {/* MOBILE LOGO */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2 lg:hidden">
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
                className="w-[170px]"
              />
            </div>

            {/* LOGIN CARD */}
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
                delay: 0.2,
                duration: 0.7,
              }}
              className="relative z-10 w-full max-w-md rounded-[36px] border border-white/20 bg-white/15 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur-3xl sm:p-10"
            >
              {/* HEADER */}
              <div className="mb-10 text-center">
                <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl">
                  Sign In
                </h1>

                <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-white/70" />
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
                  className="mb-6 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white backdrop-blur-xl"
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
                  <label className="mb-3 block text-sm font-semibold tracking-wide text-white">
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
                    className="h-16 w-full rounded-2xl border border-white/20 bg-white px-5 text-base font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:scale-[1.01] focus:border-white focus:ring-4 focus:ring-white/30"
                  />
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="mb-3 block text-sm font-semibold tracking-wide text-white">
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
                      className="h-16 w-full rounded-2xl border border-white/20 bg-white px-5 pr-14 text-base font-medium text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-300 focus:scale-[1.01] focus:border-white focus:ring-4 focus:ring-white/30"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          !showPassword
                        )
                      }
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 transition-all duration-300 hover:scale-110 hover:text-red-500"
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
                  className="group relative mt-3 h-16 w-full overflow-hidden rounded-2xl bg-white font-bold text-red-600 shadow-[0_12px_30px_rgba(255,255,255,0.22)] transition-all duration-300 hover:shadow-[0_18px_40px_rgba(255,255,255,0.32)] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <span className="relative z-10 text-lg">
                    {loginMutation.isPending
                      ? 'Signing In...'
                      : 'Login'}
                  </span>

                  <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-red-100 to-transparent transition-transform duration-1000 group-hover:translate-x-[100%]" />
                </motion.button>
              </form>

              {/* FOOTER */}
              <div className="mt-10 text-center">
                <p className="text-xs font-medium tracking-wide text-white/80">
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