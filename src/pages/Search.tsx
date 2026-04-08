import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search as SearchIcon, MapPin, MessageCircle } from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Haversine formula to calculate distance between two lat/lng points in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  const d = R * c; // Distance in km
  return d;
}

// Helper to mask name (e.g. "John Doe" -> "J*** D***")
function maskName(name: string) {
  return name.split(' ').map(word => {
    if (word.length <= 1) return word;
    return word[0] + '*'.repeat(word.length - 1);
  }).join(' ');
}

export default function Search() {
  const { currentUser, userProfile } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [donors, setDonors] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!bloodGroup) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      // In Firestore, we can only do limited filtering. 
      // We'll filter by isDonor and bloodGroup, then filter location/availability client-side for this prototype.
      const q = query(
        collection(db, 'users'),
        where('isDonor', '==', true),
        where('bloodGroup', '==', bloodGroup)
      );

      const querySnapshot = await getDocs(q);
      let results: any[] = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(doc => doc.id !== currentUser?.uid); // Don't show self

      // Client-side filtering for location text if provided
      if (locationQuery) {
        const lowerLoc = locationQuery.toLowerCase();
        results = results.filter(d => 
          d.location?.text?.toLowerCase().includes(lowerLoc)
        );
      }

      // Calculate distance if both user and donor have coords
      if (userProfile?.location?.lat && userProfile?.location?.lng) {
        results = results.map(d => {
          if (d.location?.lat && d.location?.lng) {
            const dist = calculateDistance(
              userProfile.location.lat, 
              userProfile.location.lng, 
              d.location.lat, 
              d.location.lng
            );
            return { ...d, distance: dist };
          }
          return d;
        });
        
        // Sort by distance
        results.sort((a, b) => {
          if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
          if (a.distance !== undefined) return -1;
          if (b.distance !== undefined) return 1;
          return 0;
        });
      }

      setDonors(results);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Find Blood Donors</h1>
        <p className="text-gray-600">Search for available donors in your area.</p>
      </div>

      <Card className="mb-8 border-t-4 border-t-primary shadow-sm">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="w-full md:w-1/3 space-y-2">
              <label className="text-sm font-medium">Blood Group *</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
                <option value="" disabled>Select Blood Group</option>
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-sm font-medium">Location (Optional)</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="City or Area" 
                  className="pl-9"
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={isSearching || !bloodGroup}>
              {isSearching ? 'Searching...' : <><SearchIcon className="w-4 h-4 mr-2" /> Search</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {hasSearched && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-4">
            {donors.length} {donors.length === 1 ? 'Donor' : 'Donors'} Found
          </h2>

          {donors.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
              <p className="text-gray-500">No donors found matching your criteria.</p>
              <p className="text-sm text-gray-400 mt-1">Try broadening your location search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {donors.map(donor => (
                <Card key={donor.id} className="overflow-hidden">
                  <div className="flex h-full">
                    <div className="w-20 bg-red-50 flex flex-col items-center justify-center border-r">
                      <span className="text-2xl font-bold text-primary">{donor.bloodGroup}</span>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-semibold text-lg">{maskName(donor.name)}</h3>
                          <Badge variant={donor.availability ? "success" : "secondary"}>
                            {donor.availability ? 'Available' : 'Unavailable'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 flex items-center mt-2">
                          <MapPin className="w-3 h-3 mr-1" /> 
                          {donor.location?.text || 'Unknown location'}
                        </p>
                        {donor.distance !== undefined && (
                          <p className="text-xs text-gray-500 mt-1">
                            ~{donor.distance.toFixed(1)} km away
                          </p>
                        )}
                      </div>
                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <Link to={`/chat/${donor.id}`}>
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Request Contact
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
