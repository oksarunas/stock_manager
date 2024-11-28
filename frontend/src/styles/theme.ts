import { createTheme } from "@mui/material/styles";

const glowEffect = (color: string) => `0 0 15px 5px ${color}`;

const theme = createTheme({
  palette: {
    primary: { main: "#3b82f6" },
    secondary: { main: "#1f2937" },
    error: { main: "#ff1744" },
    success: { main: "#4caf50" }, // For profit/loss indicators
    warning: { main: "#ff9800" },
    background: {
      default: "#1f2937", // Page background
      paper: "#424B5A", // Card background
    },
    text: {
      primary: "#e5e7eb", // Bright text
      secondary: "#9ca3af", // Muted gray text
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
    h1: { fontSize: "2.5rem", fontWeight: 700 },
    h2: { fontSize: "2rem", fontWeight: 700 },
    h3: { fontSize: "1.5rem", fontWeight: 600 },
    body1: { fontSize: "1rem", fontWeight: 400 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  shape: {
    borderRadius: 8, // Consistent rounded corners
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backgroundColor: "#3b82f6",
          color: "#e5e7eb",
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          "&:hover": {
            backgroundColor: "#2563eb",
            boxShadow: glowEffect("rgba(59, 130, 246, 0.5)"),
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "#424B5A",
          color: "#e5e7eb",
          borderRadius: "8px",
          boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 0 30px 10px rgba(59, 130, 246, 0.7)",
          },
        },
      },
    },
    MuiTable: {
      styleOverrides: {
        root: {
          backgroundColor: "#1a1a1a",
          color: "#e5e7eb",
          borderRadius: "8px",
          "& th": {
            color: "#e5e7eb", // Header color
            fontWeight: 700,
          },
          "& tr:nth-of-type(even)": {
            backgroundColor: "#1a1a1a", // Alternate row color
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h5: {
          color: "inherit",
          fontWeight: 700,
        },
      },
    },
  },
  customComponents: {
    BoxStyles: {
      padding: "16px",
      borderRadius: "8px",
      backgroundColor: "#424B5A",
      boxShadow: "0 0 15px rgba(59, 130, 246, 0.5)",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      "&:hover": {
        transform: "scale(1.02)",
        boxShadow: "0 0 30px rgba(59, 130, 246, 0.7)",
      },
    },
  },
});

export default theme;
