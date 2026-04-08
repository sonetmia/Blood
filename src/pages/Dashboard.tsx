import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { addDays, differenceInDays, parseISO, format } from 'date-fns';
import { Droplet, AlertCircle, Clock, MapPin, Search } from 'lucide-react';

export default function Dashboard() {
  const { currentUser, userProfile, refreshProfile } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'requests'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentRequests(reqs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (!userProfile) return null;

  const toggleAvailability = async () => {
    if (!currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        availability: !userProfile.availability
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error updating availability", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateLastDonation = async () => {
    if (!currentUser) return;
    setIsUpdating(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        lastDonationDate: new Date().toISOString(),
        availability: false // Automatically set to unavailable after donation
      });
      await refreshProfile();
    } catch (error) {
      console.error("Error updating last donation", error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Calculate eligibility
  let isEligible = true;
  let daysUntilEligible = 0;
  let nextEligibleDate = null;

  if (userProfile.lastDonationDate) {
    const lastDate = parseISO(userProfile.lastDonationDate);
    nextEligibleDate = addDays(lastDate, 90);
    const today = new Date();
    daysUntilEligible = differenceInDays(nextEligibleDate, today);
    
    if (daysUntilEligible > 0) {
      isEligible = false;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Left Column - Profile & Status */}
        <div className="w-full md:w-1/3 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{userProfile.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {userProfile.location?.text || 'Location not set'}
                  </CardDescription>
                </div>
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-primary font-bold text-xl border-2 border-red-200">
                  {userProfile.bloodGroup}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {userProfile.isDonor ? (
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Donor Status</span>
                      <Badge variant={userProfile.availability && isEligible ? "success" : "secondary"}>
                        {userProfile.availability && isEligible ? 'Available' : 'Not Available'}
                      </Badge>
                    </div>
                    
                    {!isEligible ? (
                      <div className="mt-3 text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                        <div className="flex items-center gap-2 font-medium mb-1">
                          <Clock className="w-4 h-4" />
                          Eligible in {daysUntilEligible} days
                        </div>
                        <p className="text-xs">Next eligible date: {nextEligibleDate && format(nextEligibleDate, 'MMM dd, yyyy')}</p>
                      </div>
                    ) : (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-gray-600">Currently accepting requests?</span>
                        <button 
                          onClick={toggleAvailability}
                          disabled={isUpdating}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${userProfile.availability ? 'bg-green-500' : 'bg-gray-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${userProfile.availability ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={updateLastDonation}
                    disabled={isUpdating}
                  >
                    I just donated blood
                  </Button>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-4">You are not registered as a donor.</p>
                  <Button onClick={async () => {
                    await updateDoc(doc(db, 'users', currentUser!.uid), { isDonor: true, availability: true });
                    refreshProfile();
                  }}>
                    Become a Donor
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Link to="/search" className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <Search className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium text-sm">Find Donors</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/requests" className="block">
              <Card className="hover:border-primary transition-colors cursor-pointer h-full">
                <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                  <AlertCircle className="w-8 h-8 text-primary mb-2" />
                  <span className="font-medium text-sm">Post Request</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Right Column - Emergency Requests */}
        <div className="w-full md:w-2/3 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold tracking-tight">Recent Emergencies</h2>
            <Link to="/requests">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                No active emergency requests at the moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentRequests.map(req => (
                <Card key={req.id} className={req.urgent ? 'border-red-200 shadow-sm' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-4">
                        <div className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl shrink-0 ${req.urgent ? 'bg-red-600 text-white' : 'bg-red-100 text-primary'}`}>
                          {req.bloodGroup}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{req.hospital}</h3>
                            {req.urgent && <Badge variant="destructive">Urgent</Badge>}
                          </div>
                          <p className="text-sm text-gray-600 flex items-center mb-2">
                            <MapPin className="w-3 h-3 mr-1" /> {req.location}
                          </p>
                          {req.message && <p className="text-sm text-gray-700 mt-2">{req.message}</p>}
                          <p className="text-xs text-gray-400 mt-3">
                            Posted {format(parseISO(req.createdAt), 'MMM dd, h:mm a')}
                          </p>
                        </div>
                      </div>
                      {req.userId !== currentUser?.uid && (
                        <Link to={`/chat/new-${req.userId}`}>
                          <Button variant="outline" size="sm">Contact</Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
