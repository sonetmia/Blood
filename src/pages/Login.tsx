import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithGoogle } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Droplet } from 'lucide-react';

export default function Login() {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;

  if (currentUser) {
    if (userProfile) {
      return <Navigate to="/dashboard" />;
    } else {
      return <Navigate to="/profile-setup" />;
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError('');
      await signInWithGoogle();
      // AuthContext will handle redirect via onAuthStateChanged
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Droplet className="w-6 h-6 text-primary fill-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Roktobondhu</CardTitle>
          <CardDescription>Sign in to find blood or become a donor</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <Button 
            variant="outline" 
            className="w-full h-12 text-base" 
            onClick={handleGoogleLogin}
            disabled={isLoggingIn}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Note</span>
            </div>
          </div>

          <p className="text-sm text-center text-gray-500">
            Email/Password login can be enabled in the Firebase Console. For this preview, please use Google Sign-in.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
