import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { useUser } from '../contexts/UserContext';

// A sign up page identical to the login form. In a real application this is
// where you'd create a user record in your backend. For this demo we simply
// create a new session in localStorage with free status.
export default function Signup() {
  const { user, login } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState('');

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() !== '') {
      // New signups always start as free users
      login(username.trim(), false);
      router.push('/');
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex items-center justify-center min-h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-md w-80"
        >
          <h1 className="text-2xl font-bold mb-4 text-center">Sign Up</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-green-600 text-white p-2 rounded"
          >
            Sign Up
          </button>
        </form>
      </main>
    </>
  );
}