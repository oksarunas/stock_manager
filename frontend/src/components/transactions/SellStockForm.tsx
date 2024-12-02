import React, { useEffect, useState, useContext } from "react";
import { viewPortfolio, sellStock } from "../../api";
import { RefreshContext } from "../../contexts/RefreshContext";
import { useUser } from "../hooks/useUser";
import { Box, Button, Typography, TextField, CircularProgress } from "@mui/material";

const SellStockForm: React.FC = () => {
  const [userStocks, setUserStocks] = useState<{ ticker: string; quantity: number }[]>([]);
  const [ticker, setTicker] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { triggerRefresh } = useContext(RefreshContext);
  const { user, loading: userLoading, error: userError } = useUser();

  useEffect(() => {
    const fetchStocks = async () => {
      if (!user?.id) {
        setError("User ID is required to view portfolio.");
        return;
      }
      try {
        const response = await viewPortfolio(user.id);
        if (response.success) {
          setUserStocks(response.data?.portfolio || []);
          setError("");
        } else {
          setError(response.error || "Failed to load your portfolio.");
          setUserStocks([]);
        }
      } catch (err) {
        setError("An error occurred while fetching your portfolio.");
        setUserStocks([]);
        console.error(err);
      }
    };
    fetchStocks();
  }, [user?.id, triggerRefresh]);

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleSell = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const response = await sellStock(user!.id, ticker, quantity);
      if (response.success) {
        setMessage("Stock sold successfully!");
        resetForm();
        triggerRefresh();
      } else {
        setError("Failed to sell stock.");
      }
    } catch (err) {
      setError("An error occurred while selling stock.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!ticker.trim()) {
      setError("Please enter a valid ticker symbol.");
      return false;
    }
    const stock = userStocks.find((s) => s.ticker === ticker);
    if (!stock || quantity > stock.quantity) {
      setError("Insufficient stock quantity to sell.");
      return false;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setTicker("");
    setQuantity(1);
  };

  if (userLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );
  }

  if (userError) {
    return (
      <Box textAlign="center" mt={10}>
        <Typography color="error">Failed to load user data.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
        maxWidth: "400px",
        margin: "auto",
      }}
    >
      <TextField
        label="Ticker Symbol"
        variant="outlined"
        fullWidth
        value={ticker}
        onChange={(e) => setTicker(e.target.value)}
        placeholder="e.g., AAPL"
        disabled={loading}
      />
      <TextField
        label="Quantity"
        type="number"
        variant="outlined"
        fullWidth
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        disabled={loading}
        inputProps={{ min: 1 }}
      />
      <Button
        onClick={handleSell}
        variant="contained"
        color="error"
        disabled={loading}
        fullWidth
      >
        {loading ? "Processing..." : "Sell"}
      </Button>
      {message && (
        <Typography color="success.main" align="center">
          {message}
        </Typography>
      )}
      {error && (
        <Typography color="error.main" align="center">
          {error}
        </Typography>
      )}
    </Box>
  );
};

export default SellStockForm;
