import { useState } from 'react';
import { login, register } from '../api';


interface AuthFormProps {
  onLoginSuccess: () => void;
}

export default function AuthForm({ onLoginSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
        await login(username, password);
      }
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
  };

  return (
    <div className="bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-700 w-full max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        {isLogin ? 'Sign In' : 'Create Account'}
      </h2>
      
      {error && (
        <div className="bg-red-500/20 text-red-400 p-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-slate-300 mb-1 text-sm">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-slate-300 mb-1 text-sm">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded mt-2 transition-colors"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>

      <p className="text-slate-400 text-sm text-center mt-4">
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button 
          onClick={() => setIsLogin(!isLogin)} 
          className="text-blue-400 hover:underline"
        >
          {isLogin ? 'Register' : 'Login'}
        </button>
      </p>
    </div>
  );
}