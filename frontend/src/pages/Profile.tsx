import { useState, useRef } from 'react';
import { Bell, Lock, Moon, Share2, LogOut, ChevronRight, ArrowLeft, Mail, Lock as LockIcon, BookOpen, Calendar, Trophy, Award, Camera } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { authAPI, readingAPI } from '../lib/authAPI';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

type ViewType = 'main' | 'edit' | 'notifications' | 'privacy' | 'appearance' | 'login' | 'signup' | 'terms' | 'privacyPolicy';

export function Profile() {
  const { user, setUser, loading: authLoading } = useAuthStore();
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editSuccess, setEditSuccess] = useState(false);
  const [streak, setStreak] = useState({ currentStreak: 0, longestStreak: 0, lastReadDate: null });
  const [memorizedSurahsCount, setMemorizedSurahsCount] = useState(0);
  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    bio: user?.bio || 'Striving to memorize the Quran.',
    image: null as File | null,
    imagePreview: user?.image || null,
  });
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [authFormData, setAuthFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });

  // Update currentView when user state changes (but only for login/logout, not profile updates)
  useEffect(() => {
    if (!authLoading && currentView !== 'edit') {
      if (user) {
        setCurrentView('main');
      } else {
        setCurrentView('login');
      }
    }
  }, [user, authLoading, currentView]);

  // Update formData when entering edit view or when user changes
  useEffect(() => {
    if (currentView === 'edit' && user) {
      setFormData({
        name: user.full_name || '',
        email: user.email || '',
        bio: user.bio || 'Striving to memorize the Quran.',
        image: null,
        imagePreview: user.image ? `data:image/jpeg;base64,${user.image}` : null,
      });
    }
  }, [currentView, user]);

  // Fetch reading streak when user is logged in and profile is displayed
  useEffect(() => {
    if (user && currentView === 'main') {
      const fetchData = async () => {
        try {
          const streakData = await readingAPI.getStreak();
          setStreak(streakData);
          
          // Fetch memorized surahs count
          const memorizedData = await readingAPI.getMemorizedSurahsCount();
          setMemorizedSurahsCount(memorizedData.memorizedSurahs || 0);
        } catch (error) {
          console.error('Failed to fetch data:', error);
          setMemorizedSurahsCount(0);
        }
      };
      fetchData();
    }
  }, [user, currentView]);

  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-700 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.signup(
        authFormData.email,
        authFormData.password,
        authFormData.fullName
      );

      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      setCurrentView('main');
      setAuthFormData({ email: '', password: '', fullName: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(authFormData.email, authFormData.password);

      localStorage.setItem('authToken', response.token);
      setUser(response.user);
      setCurrentView('main');
      setAuthFormData({ email: '', password: '', fullName: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setCurrentView('login');
    navigate('/profile');
  };

  const handleGoBack = () => setCurrentView('main');

  const handleSaveProfile = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Saving profile with:', { 
        name: formData.name, 
        email: formData.email, 
        bio: formData.bio,
        hasImage: !!formData.image,
        imageFile: formData.image ? { name: formData.image.name, size: formData.image.size } : null
      });
      const response = await authAPI.updateProfile({
        name: formData.name,
        email: formData.email,
        bio: formData.bio,
        image: formData.image || undefined,
      });
      
      console.log('Save response:', response);
      setUser(response.user);
      setEditSuccess(true);
      // Clear success message after 3 seconds but stay in edit view
      setTimeout(() => {
        setEditSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.error || 'Failed to save profile');
      // Keep error message visible for user to see
    } finally {
      setLoading(false);
    }
  };

  // Terms of Service View
  if (currentView === 'terms') {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={() => setCurrentView('signup')}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Terms of Service</h1>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introduction</h2>
                <p>
                  Welcome to Nur Al-Quran. These Terms of Service govern your use of our platform and services.
                  By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">2. User Responsibilities</h2>
                <p>
                  You agree to use this service only for lawful purposes and in a way that does not infringe upon the rights
                  of others or restrict their use and enjoyment of the service. Prohibited behavior includes harassing or
                  causing distress or inconvenience to any person, transmitting obscene or offensive content, disrupting the
                  normal flow of dialogue within our service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Intellectual Property Rights</h2>
                <p>
                  Unless otherwise stated, we own the intellectual property rights for all material on Nur Al-Quran.
                  All intellectual property rights are reserved. You may access this for personal use subject to restrictions
                  set in these terms and conditions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">4. User Content</h2>
                <p>
                  You retain all rights to any content you submit, post or display on or through the service.
                  By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy,
                  reproduce, process, adapt, modify, publish, transmit, display and distribute such content in any media.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Limitation of Liability</h2>
                <p>
                  In no event shall Nur Al-Quran, nor its partners, employees, agents, suppliers, or licensors be liable
                  for any damages (including, without limitation, damages for loss of data or profit, or due to business
                  interruption) arising out of the use or inability to use the materials on Nur Al-Quran.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Modifications to Terms</h2>
                <p>
                  Nur Al-Quran may revise these terms of service for its website at any time without notice.
                  By using this website, you are agreeing to be bound by the then current version of these terms of service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Contact Us</h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at support@nuralquran.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Privacy Policy View
  if (currentView === 'privacyPolicy') {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={() => setCurrentView('signup')}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Privacy Policy</h1>

            <div className="space-y-6 text-gray-700 leading-relaxed">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Information We Collect</h2>
                <p>
                  We collect information you provide directly, such as when you create an account, update your profile,
                  or contact us. This includes your name, email address, password, and any other information you choose to provide.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">2. How We Use Your Information</h2>
                <p>
                  We use the information we collect to provide, maintain, and improve our services. This includes personalizing
                  your experience, sending you technical notices and support messages, and responding to your comments and questions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Information Sharing</h2>
                <p>
                  We do not share your personal information with third parties without your consent, except as necessary to
                  provide our services or as required by law. We may share aggregated, anonymized information that cannot
                  identify you with our partners and the public.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Data Security</h2>
                <p>
                  We take reasonable measures to protect your personal information from unauthorized access, alteration, disclosure,
                  or destruction. However, no method of transmission over the Internet is completely secure.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Cookies and Tracking</h2>
                <p>
                  We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
                  You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Your Rights</h2>
                <p>
                  You have the right to access, correct, or delete your personal information. You may also have the right to
                  data portability and to object to the processing of your information. To exercise these rights, please contact us.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Changes to Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy to reflect changes in our practices or for other operational, legal,
                  or regulatory reasons. We will notify you of any material changes by updating the date of this policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us at privacy@nuralquran.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Login View
  if (currentView === 'login') {
    return (
      <div className="h-screen w-screen bg-teal-700 flex items-center justify-center px-4 fixed inset-0">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-700 mb-4 overflow-hidden">
              <img src="/src/public/logo/trans_logo_2.png" alt="Nur Al-Quran" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Nur Al-Quran</h1>
            <p className="text-white/80">Light of the Quran</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back</h2>
            <p className="text-gray-600 mb-8">Sign in to your account</p>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

            <form className="space-y-4" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-teal-700 focus-within:border-transparent">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="email"
                    value={authFormData.email}
                    onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="flex-1 focus:outline-none bg-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-teal-700 focus-within:border-transparent">
                  <LockIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="flex-1 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="text-right">
                <a href="#" className="text-sm font-semibold text-teal-700 hover:text-teal-800">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/80 text-sm">or</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* Social Login (Optional) */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 border border-white/30 text-white rounded-lg py-3 hover:bg-white/10 transition font-semibold">
              Google
            </button>
            <button className="flex-1 border border-white/30 text-white rounded-lg py-3 hover:bg-white/10 transition font-semibold">
              Facebook
            </button>
          </div>

          {/* Signup Button */}
          <p className="text-center text-white/80">
            Don't have an account?{' '}
            <button
              onClick={() => setCurrentView('signup')}
              className="font-semibold text-white hover:text-white/90"
            >
              Create one
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Signup View
  if (currentView === 'signup') {
    return (
      <div className="h-screen w-screen bg-teal-700 flex items-center justify-center px-4 py-8 fixed inset-0 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-700 mb-4 overflow-hidden">
              <img src="/src/public/logo/trans_logo_2.png" alt="Nur Al-Quran" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Nur Al-Quran</h1>
            <p className="text-white/80">Light of the Quran</p>
          </div>

          {/* Signup Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-teal-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h2>
            <p className="text-gray-600 mb-8">Join our community today</p>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>}

            <form className="space-y-4" onSubmit={handleSignup}>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={authFormData.fullName}
                  onChange={(e) => setAuthFormData({ ...authFormData, fullName: e.target.value })}
                  placeholder="Ahmed Abdullah"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-teal-700 focus-within:border-transparent">
                  <Mail className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="email"
                    value={authFormData.email}
                    onChange={(e) => setAuthFormData({ ...authFormData, email: e.target.value })}
                    placeholder="your@email.com"
                    className="flex-1 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="flex items-center border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-teal-700 focus-within:border-transparent">
                  <LockIcon className="w-5 h-5 text-gray-400 mr-2" />
                  <input
                    type="password"
                    value={authFormData.password}
                    onChange={(e) => setAuthFormData({ ...authFormData, password: e.target.value })}
                    placeholder="••••••••"
                    className="flex-1 focus:outline-none bg-transparent"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 rounded border-gray-300 text-teal-700 focus:ring-teal-700"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <button onClick={() => setCurrentView('terms')} className="text-teal-700 font-semibold hover:underline">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button onClick={() => setCurrentView('privacyPolicy')} className="text-teal-700 font-semibold hover:underline">
                    Privacy Policy
                  </button>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/80 text-sm">or</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* Social Signup (Optional) */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 border border-white/30 text-white rounded-lg py-3 hover:bg-white/10 transition font-semibold">
              Google
            </button>
            <button className="flex-1 border border-white/30 text-white rounded-lg py-3 hover:bg-white/10 transition font-semibold">
              Facebook
            </button>
          </div>

          {/* Login Link */}
          <p className="text-center text-white/80">
            Already have an account?{' '}
            <button
              onClick={() => setCurrentView('login')}
              className="font-semibold text-white hover:text-white/90"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Edit Profile View
  if (currentView === 'edit') {
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData({
            ...formData,
            image: file,
            imagePreview: reader.result as string,
          });
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="min-h-screen bg-white flex items-start justify-center pt-8 pb-8">
        <div className="w-full max-w-6xl px-6">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Profile
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Edit Profile</h1>
                <p className="text-gray-500 text-sm">Update your personal information</p>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm font-semibold">{error}</p>
              </div>
            )}

            {editSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 text-sm font-semibold">✓ Profile updated successfully!</p>
              </div>
            )}

            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-700 rounded-full"></span>
                  Profile Picture
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center border-2 border-dashed border-teal-300 overflow-hidden flex-shrink-0">
                    {formData.imagePreview ? (
                      <img src={formData.imagePreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-teal-700">{(formData.name || user?.full_name || '?').charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center gap-2 bg-teal-700 text-white px-4 py-2 rounded-lg hover:bg-teal-800 transition font-semibold"
                    >
                      <Camera className="w-4 h-4" />
                      Upload Photo
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, PNG, GIF (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-700 rounded-full"></span>
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This is how your name will appear on the platform</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 bg-teal-700 rounded-full"></span>
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">We'll use this for important notifications</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-1 h-1 bg-teal-700 rounded-full"></span>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself and your Quran journey..."
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:border-transparent transition resize-none"
                  maxLength={150}
                />
                <p className="text-xs text-gray-500 mt-2">{formData.bio.length}/150 characters</p>
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading || editSuccess}
                  className="flex-1 bg-gradient-to-r from-teal-700 to-teal-600 text-white font-semibold py-3 rounded-lg hover:from-teal-800 hover:to-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                >
                  {editSuccess ? (
                    <>
                      <span>✓</span>
                      Changes Saved
                    </>
                  ) : loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleGoBack}
                  disabled={loading}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Notifications View
  if (currentView === 'notifications') {
    const [notifications, setNotifications] = useState({
      prayerAlerts: true,
      dailyReminders: true,
      achievementNotifications: false,
      weeklyReport: true,
    });

    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Notification Settings</h1>

            <div className="space-y-4">
              {Object.entries(notifications).map(([key, enabled]) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {key === 'prayerAlerts' && 'Prayer Alerts'}
                      {key === 'dailyReminders' && 'Daily Reminders'}
                      {key === 'achievementNotifications' && 'Achievement Notifications'}
                      {key === 'weeklyReport' && 'Weekly Report'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {key === 'prayerAlerts' && 'Get notified for prayer times'}
                      {key === 'dailyReminders' && 'Daily reminder to read Quran'}
                      {key === 'achievementNotifications' && 'Notifications for unlocked achievements'}
                      {key === 'weeklyReport' && 'Receive weekly progress report'}
                    </p>
                  </div>
                  <button
                    onClick={() => setNotifications({ ...notifications, [key]: !enabled })}
                    className={`w-12 h-7 rounded-full transition flex items-center ${
                      enabled ? 'bg-teal-700' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white shadow-md transition transform ${
                        enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Privacy & Security View
  if (currentView === 'privacy') {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="space-y-6 max-w-2xl">
            {/* Change Password */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Change Password</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <button className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition mt-4">
                  Update Password
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-4">Add an extra layer of security to your account</p>
              <button className="w-full bg-teal-700 text-white font-semibold py-3 rounded-lg hover:bg-teal-800 transition">
                Enable 2FA
              </button>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Sessions</h2>
              <div className="space-y-3">
                {[
                  { device: 'Chrome on Windows', location: 'New York, USA', current: true },
                  { device: 'Safari on iPhone', location: 'New York, USA', current: false },
                ].map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800">{session.device}</p>
                      <p className="text-sm text-gray-500">{session.location}</p>
                    </div>
                    <div className="text-right">
                      {session.current && <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full">Current</span>}
                      {!session.current && <button className="text-red-600 text-sm font-semibold hover:underline">Sign Out</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Appearance View
  if (currentView === 'appearance') {
    const [theme, setTheme] = useState('light');
    const [textSize, setTextSize] = useState('medium');

    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-2 text-teal-700 font-semibold mb-8 hover:text-teal-800"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Appearance Settings</h1>

            {/* Theme */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Theme</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'light', label: 'Light', icon: '☀️' },
                  { id: 'dark', label: 'Dark', icon: '🌙' },
                  { id: 'auto', label: 'Auto', icon: '⚙️' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`p-4 rounded-lg border-2 transition text-center ${
                      theme === option.id
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">{option.icon}</div>
                    <p className="font-semibold text-gray-800">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Size */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Text Size</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'small', label: 'Small', size: 'text-sm' },
                  { id: 'medium', label: 'Medium', size: 'text-base' },
                  { id: 'large', label: 'Large', size: 'text-lg' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setTextSize(option.id)}
                    className={`p-4 rounded-lg border-2 transition text-center ${
                      textSize === option.id
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className={`font-semibold text-gray-800 ${option.size}`}>{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main View
  return (
    <div className="bg-white">
      <div className="mx-auto px-6 md:px-12 lg:px-16 py-8">
        {/* Profile Header Card */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-600 text-white rounded-2xl p-8 shadow-lg mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white/30 relative">
                {user?.image ? (
                  <img src={`data:image/jpeg;base64,${user.image}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">{user?.full_name?.charAt(0).toUpperCase() || '?'}</span>
                )}
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-green-400 rounded-full border-2 border-white flex items-center justify-center text-xs">✓</div>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{user?.full_name || 'User'}</h1>
                  <span className="bg-white text-teal-700 text-xs font-semibold px-3 py-1 rounded-full">Member</span>
                </div>
                <p className="text-teal-100 text-sm mt-2">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('edit')}
              className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          {[
            { Icon: BookOpen, label: 'Surahs Memorized', value: `${memorizedSurahsCount}` },
            { Icon: Calendar, label: 'Reading Streak', value: `${streak.currentStreak || streak.currentStreak === 0 ? streak.currentStreak : '--'} ${streak.currentStreak || streak.currentStreak === 0 ? 'Days' : ''}` },
            { Icon: Trophy, label: 'Longest Streak', value: `${streak.longestStreak || streak.longestStreak === 0 ? streak.longestStreak : '--'} ${streak.longestStreak || streak.longestStreak === 0 ? 'Days' : ''}` },
          ].map((stat, idx) => {
            const Icon = stat.Icon;
            return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <Icon className="w-8 h-8 text-teal-700" />
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
            );
          })}
        </div>

        {/* Recent Achievements & Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Achievements */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Achievements</h2>
            <div className="space-y-4">
              {[
                { Icon: Award, title: '7 Day Streak', desc: 'Maintained daily prayers for a week' },
                { Icon: BookOpen, title: 'Chapter Read', desc: 'Completed reading Surah Al-Fatihah' },
                { Icon: Trophy, title: 'Daily Regular', desc: 'Logged in 5 days in a row' },
              ].map((achievement, idx) => {
                const Icon = achievement.Icon;
                return (
                <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition flex items-center justify-between cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <Icon className="w-6 h-6 text-teal-700" />
                    <div>
                      <p className="font-semibold text-gray-800">{achievement.title}</p>
                      <p className="text-sm text-gray-500">{achievement.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition" />
                </div>
                );
              })}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Settings</h2>
            <div className="space-y-3">
              {[
                { icon: Bell, label: 'Notifications', desc: 'Prayer alerts and daily reminders', view: 'notifications' as ViewType },
                { icon: Lock, label: 'Privacy & Security', desc: 'Account security and data', view: 'privacy' as ViewType },
                { icon: Moon, label: 'Appearance', desc: 'Dark mode and theme settings', view: 'appearance' as ViewType },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentView(item.view)}
                    className="w-full bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-teal-200 transition flex items-center justify-between text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-teal-700 rounded-lg flex items-center justify-center group-hover:bg-teal-800 transition">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{item.label}</p>
                        <p className="text-sm text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </button>
                );
              })}
              
              {/* Sign Out Button */}
              <button 
                onClick={handleLogout}
                className="w-full bg-white rounded-xl p-5 shadow-sm border border-red-100 hover:bg-red-50 transition flex items-center justify-between text-left mt-6 group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center group-hover:bg-red-700 transition">
                    <LogOut className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-red-600">Sign Out</p>
                </div>
                <ChevronRight className="w-5 h-5 text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
