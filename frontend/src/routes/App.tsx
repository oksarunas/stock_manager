import React, { useEffect, useState } from "react";
import {
  Route,
  BrowserRouter as Router,
  Routes,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Container,
  CssBaseline,
  ThemeProvider,
  CircularProgress,
} from "@mui/material";
import theme from "../styles/theme";
import HomePage from "../pages/HomePage";
import Register from "../components/auth/Register";
import Dashboard from "../pages/Dashboard";
import Navbar from "../ui/NavBar";
import PrivateRoute from "./PrivateRoute";
import { logoutUser } from "../api";
import TransactionsPage from "../pages/TransactionsPage";
import Portfolio from "../pages/Portfolio";
import BudgetPage from "../pages/BudgetPage";
import Search from "../pages/Search";
import TradePage from "../pages/TradePage";
import FearGreed from "../pages/FearGreed";
import Analyze from "../pages/Analyze";
import TradingBot from "../pages/TradingBot";
import StockPage from "../pages/StockPage";

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    setIsAuthenticated(!!userId);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    const userId = localStorage.getItem("user_id");
    setIsAuthenticated(!!userId);
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    localStorage.removeItem("user_id");
    navigate("/");
  };

  if (loading) {
    return (
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress color="primary" size={60} />
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
      <Container maxWidth={false} sx={{ pt: 4 }}>
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <HomePage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/HomePage"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <HomePage onLogin={handleLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register onRegisterSuccess={handleLogin} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/fear-greed"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <FearGreed />
              </PrivateRoute>
            }
          />
          <Route
            path="/transactions"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <TransactionsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/portfolio"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Portfolio />
              </PrivateRoute>
            }
          />
          <Route
            path="/trade"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <TradePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/analyze"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Analyze />
              </PrivateRoute>
            }
          />
          <Route
            path="/tradingbot"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <TradingBot />
              </PrivateRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <BudgetPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/search"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <Search />
              </PrivateRoute>
            }
          />
          {/* Add the route for StockPage */}
          <Route
            path="/stocks/:ticker"
            element={
              <PrivateRoute isAuthenticated={isAuthenticated}>
                <StockPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App;
