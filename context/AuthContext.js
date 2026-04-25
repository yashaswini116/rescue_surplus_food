import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, setDoc, enableIndexedDbPersistence } from 'firebase/firestore';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to enable offline persistence if browser supports it
    try {
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore Logic: Persistence failed - Multiple tabs open");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore Logic: Persistence failed - Browser unsupported");
        }
      });
    } catch (e) {
      // Ignore errors in non-browser environments or unsupported setups
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          setUser(user);
          // Fetch additional user data from Firestore with a localized try/catch
          const fetchUserData = async () => {
            try {
              // Wrap getDoc in a promise that times out after 3 seconds to prevent UI hanging
              const userRef = doc(db, 'users', user.uid);
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore Fetch Timeout')), 10000)
              );
              
              const userDoc = await Promise.race([
                getDoc(userRef),
                timeoutPromise
              ]);

              if (userDoc && userDoc.exists()) {
                setUserData(userDoc.data());
              } else {
                // Fallback: Use basic account info if doc doesn't exist yet
                setUserData({ uid: user.uid, email: user.email, role: 'donor', status: 'incomplete_profile' });
              }
            } catch (dbErr) {
              console.error("AuthContext: Firestore fetch failed (offline or denied):", dbErr.message);
              // Fallback during offline/errors to keep UI alive
              setUserData({ uid: user.uid, email: user.email, role: 'donor', isOffline: true });
            }
          };
          await fetchUserData();
        } else {
          setUser(null);
          setUserData(null);
        }
      } catch (err) {
        console.error("AuthContext: Auth state change error:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email, password, role) => {
    const res = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = {
      uid: res.user.uid,
      email,
      role, // 'donor', 'receiver', 'volunteer'
      trustScore: 100,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', res.user.uid), newUser);
    } catch (e) {
      console.error("AuthContext: Failed to save user profile to Firestore:", e);
      // We still set it locally so the user can see their dashboard immediately
    }
    
    setUserData(newUser);
    return res;
  };

  const logout = () => {
    return signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userData, login, signup, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
