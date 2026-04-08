import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { format, parseISO } from 'date-fns';
import { AlertCircle, MapPin, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Requests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [bloodGroup, setBloodGroup] = useState('');
  const [hospital, setHospital] = useState('');
  const [location, setLocation] = useState('');
  const [urgent, setUrgent] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reqs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(reqs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'requests');
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !bloodGroup || !hospital || !location) return;

    setIsPosting(true);
    try {
      await addDoc(collection(db, 'requests'), {
        userId: currentUser.uid,
        bloodGroup,
        hospital,
        location,
        urgent,
        message,
        createdAt: new Date().toISOString()
      });
      setShowForm(false);
      // Reset form
      setBloodGroup('');
      setHospital('');
      setLocation('');
      setMessage('');
      setUrgent(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await deleteDoc(doc(db, 'requests', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `requests/${id}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Emergency Requests</h1>
          <p className="text-gray-600">Blood requests from hospitals near you.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : 'Post Request'}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8 border-red-200 shadow-md">
          <CardHeader className="bg-red-50 border-b pb-4">
            <CardTitle className="text-xl flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              Post Emergency Request
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Blood Group Needed *</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hospital Name *</label>
                  <Input 
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    placeholder="e.g. Dhaka Medical College"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location / Area *</label>
                <Input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Shahbag, Dhaka"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Message (Optional)</label>
                <textarea 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any specific instructions or contact info..."
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="urgent"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="urgent" className="text-sm font-medium text-red-600">
                  Mark as Urgent (Critical condition)
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={isPosting || !bloodGroup || !hospital || !location}>
                  {isPosting ? 'Posting...' : 'Post Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No active requests</p>
            <p className="text-sm text-gray-400 mt-1">There are currently no emergency blood requests.</p>
          </div>
        ) : (
          requests.map(req => (
            <Card key={req.id} className={`overflow-hidden ${req.urgent ? 'border-l-4 border-l-red-500' : ''}`}>
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-primary bg-red-50 px-3 py-1 rounded-md">
                          {req.bloodGroup}
                        </span>
                        <div>
                          <h3 className="font-bold text-lg">{req.hospital}</h3>
                          <p className="text-sm text-gray-500 flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> {req.location}
                          </p>
                        </div>
                      </div>
                      {req.urgent && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                    
                    {req.message && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                        {req.message}
                      </div>
                    )}
                    
                    <div className="mt-4 text-xs text-gray-400 flex justify-between items-center">
                      <span>Posted {format(parseISO(req.createdAt), 'MMM dd, yyyy - h:mm a')}</span>
                      
                      {currentUser?.uid === req.userId && (
                        <button 
                          onClick={() => handleDelete(req.id)}
                          className="text-red-500 hover:text-red-700 flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {currentUser?.uid !== req.userId && (
                    <div className="bg-gray-50 p-6 flex items-center justify-center sm:border-l border-t sm:border-t-0 sm:w-48">
                      <Link to={`/chat/new-${req.userId}`} className="w-full">
                        <Button className="w-full">Contact</Button>
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
