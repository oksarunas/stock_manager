import React, { useEffect, useRef } from "react";
import { Box } from "@mui/material";

const MarketUpdates: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a script element
    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;

    // Widget configuration
    script.innerHTML = JSON.stringify({
      symbols: [
        {
          proName: "FOREXCOM:SPXUSD",
          title: "S&P 500 Index",
        },
        {
          proName: "FOREXCOM:NSXUSD",
          title: "US 100 Cash CFD",
        },
        {
          proName: "FX_IDC:EURUSD",
          title: "EUR to USD",
        },
        {
          proName: "BITSTAMP:BTCUSD",
          title: "Bitcoin",
        },
        {
          proName: "BITSTAMP:ETHUSD",
          title: "Ethereum",
        },
        {
          proName: "NASDAQ:TSLA",
          title: "Tesla",
        },
      ],
      showSymbolLogo: true,
      isTransparent: false,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    // Append the script to the container div
    if (containerRef.current) {
      containerRef.current.appendChild(script);
    }

    // Cleanup function to remove the script when the component unmounts
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <Box
      sx={{
        bgcolor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "8px",
        p: 2,
        mb: 4,
        display: "flex",
        overflowX: "auto",
        gap: 2,
        height: "100px",
      }}
    >
      <div ref={containerRef} style={{ width: "100%" }} />
    </Box>
  );
};

export default React.memo(MarketUpdates);
