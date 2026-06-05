import { createContext, useContext, useEffect, useState } from 'react';
import { db } from './db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('olivia_user');
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  const login = async (email, method = 'email') => {
    let existing = await db.users.where('email').equals(email).first();
    if (!existing) {
      const id = await db.users.add({ email, role: email === 'admin@example.com' ? 'admin' : 'user', createdAt: Date.now() });
      existing = { id, email, role: email === 'admin@example.com' ? 'admin' : 'user' };
    }
    localStorage.setItem('olivia_user', JSON.stringify(existing));
    setUser(existing);
  };

  const logout = () => {
    localStorage.removeItem('olivia_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);