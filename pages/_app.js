import '../styles/globals.css';
import { UserProvider } from '../contexts/UserContext';

// The custom App component wraps every page in the UserProvider. This allows
// global state (like user session and subscription status) to be accessed
// throughout the app. It also applies global Tailwind styles.
function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;