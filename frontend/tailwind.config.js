// tailwind.config.js

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1c2536",          // Dark background color
        secondary: "#2d3748",        // Slightly lighter for headers or cards
        accent: {
          DEFAULT: "#4a90e2",        // Main accent color
          dark: "#357ABD",           // Darker accent for hover states
        },
        textPrimary: "#e2e8f0",      // Light text for readability on dark backgrounds
        textSecondary: "#a0aec0",    // Muted text color for descriptions
        cardBackground: "#2a303c",   // Background color for cards or highlights
        border: "#3b4759",           // Subtle border color
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'], // Match Material UI typography
      },
      spacing: {
        '18': '4.5rem',               // Custom spacing value for more layout options
      },
      borderRadius: {
        'lg': '12px',                 // Larger radius for smooth corners on cards
        'xl': '16px',                 // Extra-large radius for buttons and containers
      },
      boxShadow: {
        'soft': '0 2px 4px rgba(0, 0, 0, 0.1)', // Soft shadow for subtle depth
        'card': '0 4px 12px rgba(0, 0, 0, 0.15)', // Shadow for cards
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.textPrimary'),
            a: {
              color: theme('colors.accent.DEFAULT'),
              '&:hover': {
                color: theme('colors.accent.dark'), // Use the defined darker shade
              },
            },
            h1: { color: theme('colors.textPrimary') },
            h2: { color: theme('colors.textPrimary') },
            h3: { color: theme('colors.textPrimary') },
            p: { color: theme('colors.textSecondary') },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'), // Adds typography plugin for better readability
  ],
};
