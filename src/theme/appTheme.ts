import { createTheme } from "@mui/material/styles";

// Dark theme that mirrors the app's CSS custom properties (see src/index.css). MUI's palette needs
// literal, parseable colors (it computes tints/shades from them), so the values below are copied from
// index.css rather than referencing the `var(--...)` custom properties directly.
export const appTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#0f172a",
      paper: "#111c34",
    },
    text: {
      primary: "#d5d8de",
      secondary: "#95a1af",
    },
    primary: {
      main: "#38bdf8",
      contrastText: "#0f172a",
    },
    secondary: {
      main: "#2563eb",
    },
    success: {
      main: "#22c55e",
    },
    warning: {
      main: "#f59e0b",
    },
    error: {
      main: "#f87171",
    },
    divider: "rgba(148, 163, 184, 0.2)",
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily:
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        // The default MUI dark theme overlays a translucent gradient on paper surfaces based on
        // elevation; disable it so paper backgrounds stay flat and match the rest of the app.
        root: {
          backgroundImage: "none",
        },
      },
    },
  },
});
