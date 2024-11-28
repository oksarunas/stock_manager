import { ThemeOptions } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Theme {
    customComponents: {
      BoxStyles: {
        padding: string;
        borderRadius: string;
        backgroundColor: string;
        boxShadow: string;
        transition: string;
        "&:hover"?: {
          transform?: string;
          boxShadow?: string;
        };
      };
    };
  }

  // Allow configuration using `createTheme`
  interface ThemeOptions {
    customComponents?: {
      BoxStyles?: {
        padding?: string;
        borderRadius?: string;
        backgroundColor?: string;
        boxShadow?: string;
        transition?: string;
        "&:hover"?: {
          transform?: string;
          boxShadow?: string;
        };
      };
    };
  }
}
