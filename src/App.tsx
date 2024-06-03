import { Provider } from 'react-redux';
import store from './utils/store';
import { BrowserRouter, Route, Routes} from 'react-router-dom';
import AccountPage from './page/Account';
import AddAccountPage from './page/AddAccount';
import PurchasePage from './page/Purchase';
function App() {

  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<></>} />
          <Route path="/games/:gameId" element={<AccountPage />} />
          <Route path="/games/:gameId/add" element={<AddAccountPage />} />
          <Route path="/games/:gameId/accounts/:accountId" element={<PurchasePage />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  )
}

export default App
