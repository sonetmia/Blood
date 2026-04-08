import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, addDoc, onSnapshot, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Send, User as UserIcon, MessageCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Chat() {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [chatId, setChatId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      if (!currentUser || !id) return;
      
      try {
        let currentChatId = id;
        let targetUid = '';

        if (id.startsWith('new-')) {
          targetUid = id.replace('new-', '');
          // Check if chat already exists
          const q = query(
            collection(db, 'chats'),
            where('participants', 'array-contains', currentUser.uid)
          );
          const snapshot = await getDocs(q);
          const existingChat = snapshot.docs.find(doc => 
            doc.data().participants.includes(targetUid)
          );

          if (existingChat) {
            navigate(`/chat/${existingChat.id}`, { replace: true });
            return;
          } else {
            setChatId(null); // Will create on first message
          }
        } else {
          currentChatId = id;
          setChatId(currentChatId);
          // Get chat details to find target user
          const chatDoc = await getDoc(doc(db, 'chats', currentChatId));
          if (chatDoc.exists()) {
            const parts = chatDoc.data().participants;
            targetUid = parts.find((p: string) => p !== currentUser.uid);
          }
        }

        // Fetch target user details
        if (targetUid) {
          const userDoc = await getDoc(doc(db, 'users', targetUid));
          if (userDoc.exists()) {
            setTargetUser({ id: userDoc.id, ...userDoc.data() });
          }
        }

        setLoading(false);
      } catch (error) {
        console.error("Error initializing chat", error);
        setLoading(false);
      }
    };

    initChat();
  }, [id, currentUser, navigate]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, `chats/${chatId}/messages`),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newMessage.trim() || !targetUser) return;

    setIsSending(true);
    try {
      let activeChatId = chatId;

      // Create chat document if it doesn't exist
      if (!activeChatId) {
        const chatRef = await addDoc(collection(db, 'chats'), {
          participants: [currentUser.uid, targetUser.id],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        activeChatId = chatRef.id;
        setChatId(activeChatId);
        // We don't navigate to avoid remounting, just update state
      }

      // Add message
      await addDoc(collection(db, `chats/${activeChatId}/messages`), {
        senderId: currentUser.uid,
        text: newMessage.trim(),
        timestamp: new Date().toISOString()
      });

      // Update chat updatedAt
      await setDoc(doc(db, 'chats', activeChatId), {
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'messages');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center">Loading chat...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full h-[calc(100vh-4rem)] flex flex-col">
      <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-t-4 border-t-primary">
        <CardHeader className="bg-gray-50 border-b py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-primary">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{targetUser ? targetUser.name : 'Unknown User'}</CardTitle>
              <p className="text-sm text-gray-500">
                {targetUser ? `Blood Group: ${targetUser.bloodGroup}` : ''}
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
              <MessageCircle className="w-12 h-12 text-gray-200" />
              <p>No messages yet. Send a message to start the conversation.</p>
              <p className="text-xs text-center max-w-xs">
                For your privacy, phone numbers are not shared automatically. You can share contact details when you feel comfortable.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMine = msg.senderId === currentUser?.uid;
              const showTime = index === 0 || 
                (new Date(msg.timestamp).getTime() - new Date(messages[index-1].timestamp).getTime() > 5 * 60000);

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  {showTime && (
                    <span className="text-xs text-gray-400 mb-1 mx-2">
                      {format(parseISO(msg.timestamp), 'MMM dd, h:mm a')}
                    </span>
                  )}
                  <div 
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isMine 
                        ? 'bg-primary text-white rounded-tr-sm' 
                        : 'bg-gray-100 text-gray-900 rounded-tl-sm'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 bg-white border-t">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isSending}
            />
            <Button type="submit" disabled={!newMessage.trim() || isSending} className="shrink-0">
              <Send className="w-4 h-4 mr-2 hidden sm:block" />
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}


