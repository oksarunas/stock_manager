"use client";

import React from "react";
import BuyStockForm from "../components/transactions/BuyStockForm";
import SellStockForm from "../components/transactions/SellStockForm";
import { Box, Typography, Card, CardContent } from "@mui/material";

const TradePage: React.FC = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 6,
        px: 2,
      }}
    >
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: "text.primary",
          mb: 4,
        }}
        align="center"
      >
        Trade Stocks
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "center",
          gap: 4,
          width: "100%",
          maxWidth: "1200px",
        }}
      >
        <Card
          sx={{
            flex: 1,
            bgcolor: "grey.900",
            boxShadow: "0 0 20px 4px rgba(0, 123, 255, 0.5)",
            borderRadius: 3,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0 0 30px 6px rgba(0, 123, 255, 0.6)",
            },
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                color: "primary.main",
                fontWeight: "bold",
                mb: 3,
              }}
            >
              Buy Stock
            </Typography>
            <BuyStockForm />
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: 1,
            bgcolor: "grey.900",
            boxShadow: "0 0 20px 4px rgba(255, 0, 0, 0.3)",
            borderRadius: 3,
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0 0 30px 6px rgba(255, 0, 0, 0.4)",
            },
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                color: "error.main",
                fontWeight: "bold",
                mb: 3,
              }}
            >
              Sell Stock
            </Typography>
            <SellStockForm />
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default TradePage;
