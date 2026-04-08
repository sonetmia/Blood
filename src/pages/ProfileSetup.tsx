import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function ProfileSetup() {
  const { currentUser, userProfile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState(currentUser?.displayName || '');
  const [bloodGroup, setBloodGroup] = useState('');
  const [isDonor, setIsDonor] = useState(false);
  const [locationText, setLocationText] = useState('');
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (loading) return null;
  if (!currentUser) return <Navigate to="/login" />;
  if (userProfile) return <Navigate to="/dashboard" />;

  const handleGetLocation = () => {
    setIsLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationText(`Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`);
        setIsLocating(false);
      },
      (err) => {
        setError('Unable to retrieve your location. Please enter manually.');
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !bloodGroup || !locationText) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const userData = {
        uid: currentUser.uid,
        name,
        bloodGroup,
        location: {
          text: locationText,
          ...(coords ? { lat: coords.lat, lng: coords.lng } : {})
        },
        isDonor,
        availability: isDonor, // Default to available if they register as donor
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', currentUser.uid), userData);
      await refreshProfile();
      navigate('/dashboard');
    } catch (err: any) {
      setIsSaving(false);
      try {
        handleFirestoreError(err, OperationType.CREATE, `users/${currentUser.uid}`);
      } catch (e: any) {
        setError("Failed to save profile. Please try again.");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-4 py-12">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>We need a few more details to get you started.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <div className="grid grid-cols-4 gap-2">
                {BLOOD_GROUPS.map(bg => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`p-2 text-sm font-medium rounded-md border transition-colors ${
                      bloodGroup === bg 
                        ? 'bg-primary text-white border-primary' 
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <div className="flex gap-2">
                <Input 
                  value={locationText} 
                  onChange={(e) => setLocationText(e.target.value)} 
                  placeholder="City, Area or GPS"
                  required
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGetLocation}
                  disabled={isLocating}
                >
                  {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">Providing GPS location helps find nearby donors faster.</p>
            </div>

            <div className="pt-4 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">Register as a Blood Donor</span>
                  <p className="text-xs text-gray-500">You can change your availability at any time.</p>
                </div>
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Complete Profile'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
