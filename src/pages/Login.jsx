import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      login(email);
      navigate('/chat');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-purple/10 to-brand-orange/10">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-futura text-brand-purple mb-6">Welcome to Olivia ✨</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border rounded-lg" required />
          <button type="submit" className="w-full bg-brand-purple text-white py-3 rounded-lg font-bold">Continue with Email</button>
        </form>
        <div className="mt-4 text-center text-sm text-gray-500">
          <button onClick={() => login('guest@example.com')} className="text-brand-orange">Continue as guest (unlimited messages)</button>
          <p className="mt-2">Demo: Google/Apple login simulated – just type any email.</p>
        </div>
      </div>
    </div>
  );
}