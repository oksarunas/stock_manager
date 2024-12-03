import React, { useEffect, useState } from "react";
import { Route, Routes, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Container, CssBaseline, ThemeProvider, CircularProgress } from "@mui/material";
import theme from "../styles/theme";
import HomePage from "../pages/HomePage";
import Login from "../components/auth/Login";
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

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true); // Add loading state
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    setIsAuthenticated(!!userId);
    setLoading(false); // Set loading to false after checking authentication
  }, []);

  const handleLogin = () => {
    const userId = localStorage.getItem("user_id");
    setIsAuthenticated(!!userId);
  };

  const handleLogout = () => {
    logoutUser();
    setIsAuthenticated(false);
    localStorage.removeItem("user_id");
    navigate("/login");
  };

  if (loading) {
    // Display a loading indicator while checking authentication
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
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to={location.pathname} replace />
              ) : (
                <Login onLoginSuccess={handleLogin} />
              )
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? (
                <Navigate to={location.pathname} replace />
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
        </Routes>
      </Container>
    </ThemeProvider>
  );
}

export default App;
