import React, { useEffect, useState, useContext } from "react";
import { viewPortfolio, sellStock } from "../../api";
import { RefreshContext } from "../../contexts/RefreshContext";
import { useUser } from "../hooks/useUser";
import {
  Box,
  Button,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";

interface UserStock {
  ticker: string;
  quantity: number;
}

const SellStockForm: React.FC = () => {
  // States
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Context and User
  const { triggerRefresh } = useContext(RefreshContext);
  const { user, loading: userLoading, error: userError } = useUser();

  // Fetch user stocks
  useEffect(() => {
    const fetchUserStocks = async () => {
      if (!user?.id) {
        setError("User ID is required to view portfolio.");
        return;
      }

      try {
        const response = await viewPortfolio(user.id);
        if (response.success && response.data) {
          setUserStocks(response.data.portfolio);
          setError("");
        } else {
          setUserStocks([]);
          setError("Failed to load your portfolio.");
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching your portfolio.");
        console.error("Failed to load user stocks:", err);
      }
    };

    if (user?.id) fetchUserStocks();
  }, [user?.id, triggerRefresh]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Validate and handle stock selling
  const handleSell = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await sellStock(user!.id, selectedTicker, quantity);
      if (response.success) {
        setMessage("Stock sold successfully.");
        resetForm();
        triggerRefresh();
      } else {
        setError(response.error || "Failed to sell stock.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while selling stock.");
      console.error("Sell stock error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!user) {
      setError("User is not available. Please log in again.");
      return false;
    }

    if (!selectedTicker) {
      setError("Please select a stock to sell.");
      return false;
    }

    const stock = userStocks.find((s) => s.ticker === selectedTicker);
    if (!stock) {
      setError("Selected stock not found in your portfolio.");
      return false;
    }

    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return false;
    }

    if (quantity > stock.quantity) {
      setError(`You cannot sell more than you own (${stock.quantity}).`);
      return false;
    }

    return true;
  };

  // Reset form
  const resetForm = () => {
    setSelectedTicker("");
    setQuantity(1);
  };

  // Render loading and error states
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

  // Component UI
  return (
    <Box>
      <FormControl fullWidth margin="normal">
        <InputLabel>Select Stock</InputLabel>
        <Select
          value={selectedTicker}
          onChange={(e) => setSelectedTicker(e.target.value as string)}
          disabled={loading || userStocks.length === 0}
        >
          <MenuItem value="">
            <em>-- Select Stock --</em>
          </MenuItem>
          {userStocks.map((stock) => (
            <MenuItem key={stock.ticker} value={stock.ticker}>
              {stock.ticker} (Owned: {stock.quantity})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedTicker && (
        <TextField
          label="Quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          fullWidth
          margin="normal"
          inputProps={{
            min: 1,
            max: userStocks.find((stock) => stock.ticker === selectedTicker)?.quantity || 1,
          }}
          disabled={loading}
        />
      )}

      {message && (
        <Typography color="success.main" sx={{ mt: 2, textAlign: "center" }}>
          {message}
        </Typography>
      )}
      {error && (
        <Typography color="error.main" sx={{ mt: 2, textAlign: "center" }}>
          {error}
        </Typography>
      )}

        <Button
          onClick={handleSell}
          variant="contained"
          color="primary"
          fullWidth
          disabled={!selectedTicker || loading || userStocks.length === 0}
          sx={{
            mt: 2,
            backgroundColor: !selectedTicker ? "grey.700" : "primary.main", // Grey background when disabled
            color: !selectedTicker ? "grey.400" : "white", // Light grey text when disabled
            "&:hover": {
              backgroundColor: !selectedTicker ? "grey.700" : "primary.dark", // No hover effect when disabled
            },
            px: 4,
            py: 1.5,
            fontSize: "1rem",
            borderRadius: "8px",
            boxShadow: !selectedTicker
              ? "none" // No shadow when disabled
              : "0 0 10px rgba(59, 130, 246, 0.5)", // Blue glow when enabled
            transition: "background-color 0.3s ease, box-shadow 0.3s ease", // Smooth transitions
          }}
        >
          {loading ? "Processing..." : "Sell"}
        </Button>


    </Box>
  );
};

export default SellStockForm;
