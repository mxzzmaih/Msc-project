'use client';

import React, { JSX, useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth } from '../firebase/config'; // Adjust path as needed

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface AuthPageProps {
  onBack?: () => void;
  onAuthSuccess?: (user: FirebaseUser) => void;
}

export default function AuthPage({ onBack, onAuthSuccess }: AuthPageProps): JSX.Element {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Initialize Google Auth Provider
  const googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Session state management
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      
      if (user && onAuthSuccess) {
        onAuthSuccess(user);
      }
    });

    return () => unsubscribe();
  }, [onAuthSuccess]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      } else if (formData.name.length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFirebaseErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please try again.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed before completion.';
      case 'auth/popup-blocked':
        return 'Sign-in popup was blocked by your browser.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.';
      case 'auth/account-exists-with-different-credential':
        return 'An account already exists with the same email but different sign-in credentials.';
      default:
        return 'Something went wrong. Please try again.';
    }
  };

  const handleEmailPasswordAuth = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      let userCredential;
      
      if (isLogin) {
        // Sign in existing user
        userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
        console.log('User signed in:', userCredential.user);
      } else {
        // Create new user
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        // Update the user's display name
        await updateProfile(userCredential.user, {
          displayName: formData.name
        });
        
        console.log('User created:', userCredential.user);
      }
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
    } catch (error: any) {
      console.error('Auth error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setIsGoogleLoading(true);
    setErrors({});

    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google sign-in successful:', result.user);
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      
    } catch (error: any) {
      console.error('Google auth error:', error);
      const errorMessage = getFirebaseErrorMessage(error.code);
      setErrors({ general: errorMessage });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    
    // Type-safe way to update form data
    setFormData(prev => ({ ...prev, [name]: value } as FormData));
    
    // Clear specific error when user starts typing - type-safe approach
    const fieldName = name as keyof FormErrors;
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: undefined }));
    }
  };

  const toggleMode = (): void => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setErrors({});
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const isEmailButton = e.currentTarget.dataset.type === 'email';
    if (!isLoading && !isGoogleLoading) {
      if (isEmailButton) {
        e.currentTarget.style.backgroundColor = '#4338CA';
      } else {
        e.currentTarget.style.backgroundColor = '#F3F4F6';
      }
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>): void => {
    const isEmailButton = e.currentTarget.dataset.type === 'email';
    if (!isLoading && !isGoogleLoading) {
      if (isEmailButton) {
        e.currentTarget.style.backgroundColor = '#4F46E5';
      } else {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
      }
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>): void => {
    e.target.style.borderColor = '#4F46E5';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: keyof FormErrors): void => {
    e.target.style.borderColor = errors[fieldName] ? '#EF4444' : '#E5E7EB';
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" 
           style={{ backgroundColor: '#FDFDFD' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  // If user is already authenticated, show success message
  if (currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" 
           style={{ backgroundColor: '#FDFDFD' }}>
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome back!</h2>
            <p className="text-gray-600">You're already signed in as {currentUser.displayName || currentUser.email}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" 
         style={{ backgroundColor: '#FDFDFD' }}>
      
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          <ArrowRight size={20} className="rotate-180" />
          <span className="text-sm font-medium">Back</span>
        </button>
      )}
      
      {/* Main Container */}
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" 
              style={{ 
                color: '#333333',
                fontSize: '2rem',
                fontWeight: 700,
                lineHeight: 1.25,
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif"
              }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-base" 
             style={{ 
               color: '#555555',
               fontSize: '1rem',
               fontWeight: 400,
               lineHeight: 1.5
             }}>
            {isLogin 
              ? 'Sign in to continue to your notes' 
              : 'Join us to start organizing your thoughts'
            }
          </p>
        </div>

        {/* Form Card */}
        <div className="p-8 rounded-lg shadow-sm border"
             style={{ 
               backgroundColor: '#FFFFFF',
               borderRadius: '8px',
               borderColor: '#E5E7EB',
               boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
             }}>
          
          {/* General Error */}
          {errors.general && (
            <div className="mb-6 p-3 rounded-md border text-sm"
                 style={{ 
                   backgroundColor: '#FEF2F2',
                   borderColor: '#FECACA',
                   color: '#EF4444'
                 }}>
              {errors.general}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            data-type="google"
            className="w-full flex items-center justify-center gap-3 py-3 px-4 border rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm mb-6"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E5E7EB',
              color: '#374151',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 500
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {isGoogleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                Signing in...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{ borderColor: '#E5E7EB' }}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500" style={{ backgroundColor: '#FFFFFF' }}>
                Or continue with email
              </span>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Name Field (Signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2"
                       style={{ 
                         color: '#333333',
                         fontSize: '0.875rem',
                         fontWeight: 400,
                         lineHeight: 1.4
                       }}>
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} style={{ color: '#9CA3AF' }} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: errors.name ? '#EF4444' : '#E5E7EB',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      backgroundColor: '#FFFFFF'
                    }}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlur(e, 'name')}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
                    {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium mb-2"
                     style={{ 
                       color: '#333333',
                       fontSize: '0.875rem',
                       fontWeight: 400,
                       lineHeight: 1.4
                     }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} style={{ color: '#9CA3AF' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: errors.email ? '#EF4444' : '#E5E7EB',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    backgroundColor: '#FFFFFF'
                  }}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlur(e, 'email')}
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium mb-2"
                     style={{ 
                       color: '#333333',
                       fontSize: '0.875rem',
                       fontWeight: 400,
                       lineHeight: 1.4
                     }}>
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} style={{ color: '#9CA3AF' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-12 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: errors.password ? '#EF4444' : '#E5E7EB',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    lineHeight: 1.5,
                    backgroundColor: '#FFFFFF'
                  }}
                  onFocus={handleFocus}
                  onBlur={(e) => handleBlur(e, 'password')}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                >
                  {showPassword ? 
                    <EyeOff size={20} style={{ color: '#9CA3AF' }} /> : 
                    <Eye size={20} style={{ color: '#9CA3AF' }} />
                  }
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password Field (Signup only) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2"
                       style={{ 
                         color: '#333333',
                         fontSize: '0.875rem',
                         fontWeight: 400,
                         lineHeight: 1.4
                       }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={20} style={{ color: '#9CA3AF' }} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border rounded-md focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: errors.confirmPassword ? '#EF4444' : '#E5E7EB',
                      borderRadius: '4px',
                      fontSize: '1rem',
                      lineHeight: 1.5,
                      backgroundColor: '#FFFFFF'
                    }}
                    onFocus={handleFocus}
                    onBlur={(e) => handleBlur(e, 'confirmPassword')}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                  >
                    {showConfirmPassword ? 
                      <EyeOff size={20} style={{ color: '#9CA3AF' }} /> : 
                      <Eye size={20} style={{ color: '#9CA3AF' }} />
                    }
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm" style={{ color: '#EF4444' }}>
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleEmailPasswordAuth}
              disabled={isLoading || isGoogleLoading}
              data-type="email"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md"
              style={{
                backgroundColor: '#4F46E5',
                color: '#FFFFFF',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: isLoading ? undefined : '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Processing...
                </>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Toggle Mode */}
        <div className="text-center mt-6">
          <p className="text-sm" 
             style={{ 
               color: '#555555',
               fontSize: '0.875rem',
               fontWeight: 400,
               lineHeight: 1.4
             }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={toggleMode}
              className="font-medium hover:underline transition-colors"
              style={{ 
                color: '#4F46E5',
                fontWeight: 500
              }}
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}