import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useEffect, useMemo, useState } from 'react';
import { auth } from '../config/firebaseConfig';

type AuthContextType = {
  user: FirebaseUser | null;
  token: string | null;
  initializing: boolean;
  rememberPref: boolean | null;
  setRememberPref: (v: boolean | null) => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  initializing: true,
  rememberPref: null,
  setRememberPref: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [rememberPref, setRememberPref] = useState<boolean | null>(null);
  const [refreshTimer, setRefreshTimer] = useState<any>(null);
  const hasSubscribedRef = React.useRef(false);
  const rememberPrefRef = React.useRef<boolean | null>(null);

  // keep a ref in sync with the latest rememberPref so the listener can read
  // the current preference without requiring re-subscription
  useEffect(() => {
    rememberPrefRef.current = rememberPref;
  }, [rememberPref]);

  // Load remember preference once on mount
  useEffect(() => {
    (async () => {
      try {
        const val = await AsyncStorage.getItem('remember_me');
        // If no preference has been saved yet (null), treat it as remembered by default
        setRememberPref(val === null ? true : val === 'true');
        console.debug('[AuthContext] loaded remember_me=', val);
      } catch (err) {
        console.warn('Failed to load remember preference', err);
        setRememberPref(true);
      }
    })();
  }, []);

  // Set up auth state listener after we know rememberPref (to avoid race)
  useEffect(() => {
    if (rememberPref === null) return;
    if (hasSubscribedRef.current) return; // subscribe only once
  hasSubscribedRef.current = true;
  let isInitialCheck = true;
  const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        // signed out
        setUser(null);
        setToken(null);
        await AsyncStorage.removeItem('firebase_id_token');
        delete axios.defaults.headers.common.Authorization;
        setInitializing(false);
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          setRefreshTimer(null);
        }
        // mark that initial check has completed
        isInitialCheck = false;
        return;
      }

      // If this is the initial auth check on app startup, and the user previously
      // opted out of "remember me", sign them out to avoid silently keeping the session.
  if (isInitialCheck && rememberPrefRef.current === false) {
        try {
          await auth.signOut();
          isInitialCheck = false;
          return;
        } catch (err) {
          console.warn('Failed to sign out non-remembered user on initial check', err);
        }
      }

      // Normal path: set user and attach token; for non-remembered sessions we
      // do NOT persist the token to AsyncStorage so the session won't survive app restarts.
        setUser(u);
      try {
        const idToken = await u.getIdToken();
        setToken(idToken);
        if (rememberPrefRef.current === true) {
          await AsyncStorage.setItem('firebase_id_token', idToken);
        } else {
          // Ensure no stale token remains saved
          await AsyncStorage.removeItem('firebase_id_token');
        }
        axios.defaults.headers.common.Authorization = `Bearer ${idToken}`;

        // schedule a proactive refresh 1 minute before expiration
        try {
          const result = await u.getIdTokenResult();
          const expMs = new Date(result.expirationTime).getTime();
          const now = Date.now();
          const msUntilExp = expMs - now;
          const refreshAfter = Math.max(30 * 1000, msUntilExp - 60 * 1000);
          if (refreshTimer) clearTimeout(refreshTimer);
          const t = setTimeout(async () => {
            if (auth.currentUser) {
              const newToken = await auth.currentUser.getIdToken(true);
              if (rememberPrefRef.current === true) {
                await AsyncStorage.setItem('firebase_id_token', newToken);
              }
              setToken(newToken);
              axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            }
          }, refreshAfter);
          setRefreshTimer(t);
        } catch (err) {
          console.warn('Failed to schedule token refresh', err);
        }
      } catch (err) {
        console.warn('Failed to get id token on auth change', err);
      }
      setInitializing(false);
      isInitialCheck = false;
    });

    return () => {
      unsubscribe();
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, [rememberPref, refreshTimer]);

  // Attach axios interceptors to attach fresh token and retry on 401
  useEffect(() => {
    const req = axios.interceptors.request.use(
      async (config) => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const fresh = await currentUser.getIdToken();
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${fresh}`;
          } catch (err) {
            // ignore
            console.warn('Failed to attach fresh token to request', err);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const res = axios.interceptors.response.use(
      (r) => r,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          if (auth.currentUser) {
            try {
              const newToken = await auth.currentUser.getIdToken(true);
              axios.defaults.headers.common.Authorization = `Bearer ${newToken}`;
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              await AsyncStorage.setItem('firebase_id_token', newToken);
              return axios(originalRequest);
            } catch (err) {
              // refresh failed
              console.warn('Token refresh failed in interceptor', err);
            }
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(req);
      axios.interceptors.response.eject(res);
    };
  }, []);

  const value = useMemo(() => ({ user, token, initializing, rememberPref, setRememberPref }), [user, token, initializing, rememberPref, setRememberPref]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
