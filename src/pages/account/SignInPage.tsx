import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SocialLoginButtons } from '@/components/shared/SocialLoginButtons';
import { useAuth } from '@/context/AuthContext';

export function SignInPage() {
  const navigate = useNavigate();
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signInWithEmail(email, password);
    setLoading(false);
    if (authError) {
      setError(authError);
      return;
    }
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex justify-center"><Logo size="lg" /></Link>
        </div>
        <div className="card p-8">
          <h1 className="text-page font-bold text-neutral-900 mb-2">Sign in</h1>
          <p className="text-body text-neutral-500 mb-6">Welcome back. Sign in to manage your bookings.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="signin_email" className="input-label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="signin_email" type="email" className="input-field pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="signin_password" className="input-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="signin_password" type="password" className="input-field pl-10" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-body text-error-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign in'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6">
            <SocialLoginButtons disabled={loading} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-body text-neutral-500">Don't have an account? <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">Create one</Link></p>
          </div>
          <div className="mt-4 text-center">
            <Link to="/manage-booking" className="text-meta text-neutral-500 hover:text-brand-600">Manage a booking without an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
