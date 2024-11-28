import { createTheme } from "@mui/material/styles";

const glowEffect = (color: string) => `0 0 15px 5px ${color}`;

const theme = createTheme({
  palette: {
    primary: { main: "#3b82f6" }, // Blue
    secondary: { main: "#1f2937" }, // Gray
    error: { main: "#ff1744" }, // Red for errors
    background: {
      default: "#1f2937", // Dark background
      paper: "#424B5A", // Card background
    },
    text: {
      primary: "#e5e7eb", // White text
      secondary: "#9ca3af", // Gray text
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
          backgroundColor: "#3b82f6", // Tailwind blue
          color: "#e5e7eb", // White text
          padding: "0.5rem 1rem",
          "&:hover": {
            backgroundColor: "#2563eb",
            boxShadow: glowEffect("rgba(59, 130, 246, 0.5)"), // Blue glow
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
          boxShadow: "0 0 15px 5px rgba(59, 130, 246, 0.5)", // Default blue glow
          transition: "transform 0.3s ease, box-shadow 0.3s ease",
          "&:hover": {
            transform: "scale(1.02)",
            boxShadow: "0 0 30px 10px rgba(59, 130, 246, 0.6)", // Enhanced hover glow
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          padding: "2rem",
          backgroundColor: "#424B5A",
          borderRadius: "8px",
          boxShadow: glowEffect("rgba(59, 130, 246, 0.5)"), // Blue glow
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h5: {
          color: "inherit", // Inherit color for better flexibility
          fontWeight: 700, // Make titles bold
        },
      },
    },
  },
});

export default theme;
