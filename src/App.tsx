import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Account from './page/Account';
import AddAccount from './page/AddAccount';
import Login from './pages/Login';
import Home from './page/Home';
import Email from './page/Email';
import SubRollerEmail from './page/SubRollerEmail';
import { Provider } from 'react-redux';
import { store } from './store';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import PurchasePage from './page/Purchase';
import ChangePassword from './components/ChangePassword';
import Navigation from './components/Navigation';
import { useEffect, useState } from 'react';
import { useGetRollerQuery, useGetEmailsQuery } from './services/api';
import Pusher from 'pusher-js';
import EmailViewer from './page/EmailViewer';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

interface Email {
  id: number;
  to: string;
  from: string;
  subject: string;
  body: string;
  is_html: boolean;
  created_at: string;
  is_read: boolean;
}

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const isEmailViewer = window.location.pathname.includes('/email-viewer');
  
  const { data: roller } = useGetRollerQuery(undefined, { skip: isEmailViewer });
  const {
    data: emailData,
    refetch: refetchEmails
  } = useGetEmailsQuery({ page: 1 }, { skip: isEmailViewer });

  // Calculate unread count from RTK Query data
  const emails = (emailData?.data?.emails || []).map(email => ({
    ...email,
    is_read: email.is_read ?? false
  }));
  const unreadCount = emails.filter(email => !email.is_read).length;

  // Setup Pusher connection
  useEffect(() => {
    if (!isAuthenticated || !roller?.code || isEmailViewer) return;

    const pusher = new Pusher(import.meta.env.VITE_PUSHER_KEY, {
      cluster: import.meta.env.VITE_PUSHER_CLUSTER,
      authEndpoint: '/api/pusher/auth',
    });

    const channelName = `private-${roller.code.toLowerCase()}`;
    const channel = pusher.subscribe(channelName);

    channel.bind('new-email', () => {
      refetchEmails();
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusher.disconnect();
    };
  }, [isAuthenticated, roller?.code, isEmailViewer]);

  const [selectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    if (selectedEmail && refetchEmails && !isEmailViewer) {
      // Only refetch if the email is now read
      if (selectedEmail.is_read) {
        refetchEmails();
      }
    }
  }, [selectedEmail, refetchEmails, isEmailViewer]);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          {!isEmailViewer && (
            <Navigation unreadCount={unreadCount} theme={theme} toggleTheme={toggleTheme} />
          )}
          <main className={isEmailViewer ? '' : 'py-10'}>
            <div className="max-w-screen-2xl mx-auto sm:px-6 lg:px-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/games/:gameId" element={<Account />} />
                <Route
                  path="/games/:gameId/add"
                  element={
                    <PrivateRoute>
                      <AddAccount />
                    </PrivateRoute>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/games/:gameId/accounts/:accountId" element={<PurchasePage />} />
                <Route
                  path="/change-password"
                  element={
                    <PrivateRoute>
                      <ChangePassword />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/email"
                  element={
                    <PrivateRoute>
                      <Email refetchEmails={refetchEmails} />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/sub-roller-email"
                  element={
                    <PrivateRoute>
                      <SubRollerEmail />
                    </PrivateRoute>
                  }
                />
                <Route path="/email-viewer" element={<EmailViewer />} />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
