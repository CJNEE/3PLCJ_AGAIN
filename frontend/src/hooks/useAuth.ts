import { useAuthStore } from '@/context/authStore';
import { useEffect } from 'react';

export const useAuth = () => {
  const store = useAuthStore();
  
  // Initialize from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const currentUser = localStorage.getItem('currentUser');
    const currentEmployee = localStorage.getItem('currentEmployee');
    
    if (token) {
      store.setToken(token);
      store.setIsAuthenticated(true);
      
      if (currentUser) {
        try {
          const user = JSON.parse(currentUser);
          store.setUser(user);
        } catch (e) {
          console.error('Failed to parse user from localStorage:', e);
        }
      }
      
      if (currentEmployee) {
        try {
          const employee = JSON.parse(currentEmployee);
          store.setEmployee(employee);
        } catch (e) {
          console.error('Failed to parse employee from localStorage:', e);
        }
      }
    }
  }, []);
  
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
