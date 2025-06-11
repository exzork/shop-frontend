import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Account from './page/Account';
import AddAccount from './page/AddAccount';
import Login from './pages/Login';
import Home from './page/Home';
import UpdateEmail from './page/UpdateEmail';
import { Provider } from 'react-redux';
import { store } from './store';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import PurchasePage from './page/Purchase';
import ChangePassword from './components/ChangePassword';
import Navigation from './components/Navigation';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          <main className="py-10">
            <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
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
                  path="/update-email"
                  element={
                    <PrivateRoute>
                      <UpdateEmail />
                    </PrivateRoute>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
