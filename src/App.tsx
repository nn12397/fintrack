import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import BillsPage from './pages/BillsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import DebitCardsPage from './pages/DebitCardsPage';
import PayoffPlansPage from './pages/PayoffPlansPage';
import BudgetPage from './pages/BudgetPage';
import GoalsPage from './pages/GoalsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import IncomePage from './pages/IncomePage';
import IncomeBook from './components/dashboard/Incomebook';
import SavingsPage from './pages/SavingsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/*"
          element={
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/bills" element={<BillsPage />} />
                <Route path="/credit-cards" element={<CreditCardsPage />} />
                <Route path="/debit-cards" element={<DebitCardsPage />} />
                <Route path="/savings" element={<SavingsPage />} />
                <Route path="/payoff-plans" element={<PayoffPlansPage />} />
                <Route path="/budget" element={<BudgetPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/income" element={<IncomePage />} />
                <Route path="/income-book" element={<IncomeBook />} />
              </Routes>
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;