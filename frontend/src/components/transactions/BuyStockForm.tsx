import React, { useState, useContext, useEffect } from "react";
import { RefreshContext } from "../../contexts/RefreshContext";
import { addStock } from "../../api"; // Adjust the API call if necessary
import { useUser } from "../hooks/useUser";
import { TextField, Button, Typography, CircularProgress, Box } from "@mui/material";

const AddStockForm: React.FC = () => {
  const [ticker, setTicker] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [purchasePrice, setPurchasePrice] = useState<number | null>(null); // Add purchase price field
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { triggerRefresh } = useContext(RefreshContext);
  const { user, loading: userLoading, error: userError } = useUser();

  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  const handleAdd = async () => {
    if (!validateForm()) return;
  
    setLoading(true);
    setMessage("");
    setError("");
  
    try {
      const response = await addStock(
        user!.id,
        ticker.toUpperCase(),
        quantity,
        purchasePrice || 0 // Default to 0 if null
      );
      if (response.success) {
        setMessage("Stock added successfully.");
        resetForm();
        triggerRefresh();
      } else {
        setError(response.error || "Failed to add stock.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while adding stock.");
    } finally {
      setLoading(false);
    }
  };
  

  const validateForm = (): boolean => {
    if (!user?.id) {
      setError("User ID is required to add stocks.");
      return false;
    }
    if (!ticker.trim()) {
      setError("Please enter a valid ticker symbol.");
      return false;
    }
    if (quantity <= 0) {
      setError("Quantity must be at least 1.");
      return false;
    }
    if (purchasePrice === null || purchasePrice <= 0) {
      setError("Please enter a valid purchase price.");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setTicker("");
    setQuantity(1);
    setPurchasePrice(null);
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
      <TextField
        label="Purchase Price"
        type="number"
        variant="outlined"
        fullWidth
        value={purchasePrice || ""}
        onChange={(e) => setPurchasePrice(Number(e.target.value))}
        disabled={loading}
        inputProps={{ min: 0 }}
        placeholder="e.g., 150.00"
      />
      <Button
        onClick={handleAdd}
        variant="contained"
        color="primary"
        disabled={loading}
        fullWidth
      >
        {loading ? "Processing..." : "Add Stock"}
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

export default AddStockForm;
