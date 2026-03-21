import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';


const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await api.get('/auth/me');
        // getMe controller returns { user, courses } directly
        setUser(response.data.user || response.data.data?.user || response.data.data); 
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    setUser(response.data.data.user); 
    return response.data;
  };

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData);
    setUser(response.data.data.user); 
    return response.data
  };

  const logout = async () => {
    const response = await api.post('/auth/logout');
    
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
