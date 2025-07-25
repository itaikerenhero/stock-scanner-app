import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import { useUser } from '../contexts/UserContext';

// A simple login form. Users can enter any username to log in. The session
// persists via localStorage in the UserProvider. If a user is already logged
// in they are redirected to the home page.
export default function Login() {
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
          <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 rounded mb-4"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded"
          >
            Login
          </button>
        </form>
      </main>
    </>
  );
}