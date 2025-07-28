import React from "react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "./lib/userStore";
import type { UserState } from "./lib/userStore";
import { auth } from "./lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { SellerDashboard } from "./components/SellerDashboard";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
} from "react-router-dom";

function Home() {
  const user = useUserStore((state: UserState) => state.user);
  const setUser = useUserStore((state: UserState) => state.setUser);
  const logout = useUserStore((state: UserState) => state.logout);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setUser({
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
      navigate("/");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <header className="py-4 px-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Meme Marketplace
        </h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-900 dark:text-white">
                Welcome, {user.displayName}
              </span>
              <Button onClick={handleLogout} variant="outline">
                Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleGoogleLogin}>Login with Google</Button>
          )}
        </div>
      </header>
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="mb-8">
            <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-white">
              Marketplace for Memes
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Discover, buy, and sell the funniest memes on the internet. Join
              thousands of creators and collectors in the ultimate meme
              marketplace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button size="lg" className="text-lg px-8 py-3">
              Start Shopping
            </Button>
            <Link to="/seller-dashboard">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                Sell Your Memes
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🎨</div>
              <h3 className="text-xl font-semibold mb-2">Create</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Upload your original memes and start earning
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">Earn</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get paid for every meme purchase
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold mb-2">Share</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Spread laughter across the internet
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const user = useUserStore((state: UserState) => state.user);
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/seller-dashboard"
          element={
            <ProtectedRoute>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
