import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SocialLoginButtons } from '@/components/shared/SocialLoginButtons';
import { useAuth } from '@/context/AuthContext';

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fullName || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: authError } = await signUpWithEmail(email, password);
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
          <h1 className="text-page font-bold text-neutral-900 mb-2">Create account</h1>
          <p className="text-body text-neutral-500 mb-6">Sign up to book and manage your travel.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg_name" className="input-label">Full name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="reg_name" type="text" className="input-field pl-10" placeholder="Enter your full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="reg_email" className="input-label">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="reg_email" type="email" className="input-field pl-10" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="reg_password" className="input-label">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="reg_password" type="password" className="input-field pl-10" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="reg_confirm" className="input-label">Confirm password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input id="reg_confirm" type="password" className="input-field pl-10" placeholder="Re-enter password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            {error && <p className="text-body text-error-600">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create account'} <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-6">
            <SocialLoginButtons disabled={loading} />
          </div>

          <div className="mt-6 text-center">
            <p className="text-body text-neutral-500">Already have an account? <Link to="/signin" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
