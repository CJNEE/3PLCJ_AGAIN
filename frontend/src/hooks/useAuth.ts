import { useAuthStore } from '@/context/authStore';

export const useAuth = () => {
  const store = useAuthStore();
  
  return {
    user: store.user,
    employee: store.employee,
    token: store.token || localStorage.getItem('access_token'),
    isAuthenticated: store.isAuthenticated,
    
    setUser: store.setUser,
    setEmployee: store.setEmployee,
    setToken: store.setToken,
    setIsAuthenticated: store.setIsAuthenticated,
    logout: store.logout,
  };
};

export const useIsDarkMode = () => {
  const isDarkMode = useAuthStore((state) => state.isDarkMode);
  const toggleDarkMode = useAuthStore((state) => state.toggleDarkMode);
  
  return { isDarkMode, toggleDarkMode };
};
