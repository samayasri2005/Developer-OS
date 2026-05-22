import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  ensureUserProfile,
  getUserProfile,
  type UserProfile,
} from "@/lib/userProfile";
import { useTasks } from "@/store/tasks";

type AuthContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const initStore = useTasks((s) => s.initStore);
  const clearStore = useTasks((s) => s.clearStore);

  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    const profile = await getUserProfile(auth.currentUser.uid);
    setUserProfile(profile);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setUserProfile(null);
        clearStore();
        setLoading(false);
        return;
      }

      try {
        const profile = await ensureUserProfile(nextUser);
        setUserProfile(profile);
        // Load all task/note data from Firestore for this user
        await initStore(nextUser.uid);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [initStore, clearStore]);

  const signOut = async () => {
    clearStore();
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
