"use client";

import { useMemo, useEffect, useState, createContext, useContext, useCallback } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

// 1. Create ChillModeContext
interface ChillModeContextType {
  isChillMode: boolean;
  setIsChillMode: (value: boolean) => void;
}
const ChillModeContext = createContext<ChillModeContextType | undefined>(undefined);

// Custom hook to use the chill mode context
export function useChillMode() {
  const context = useContext(ChillModeContext);
  if (context === undefined) {
    throw new Error('useChillMode must be used within a ChillModeProvider');
  }
  return context;
}

// ChillModeProvider to manage and persist the state
function ChillModeProvider({ children }: { children: React.ReactNode }) {
  const [isChillMode, setIsChillModeState] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedChillMode = localStorage.getItem('isChillMode');
    if (storedChillMode !== null) {
      setIsChillModeState(JSON.parse(storedChillMode));
    }
  }, []);

  const setIsChillMode = useCallback((value: boolean) => {
    setIsChillModeState(value);
    if (mounted) {
      localStorage.setItem('isChillMode', JSON.stringify(value));
    }
  }, [mounted]);

  const value = useMemo(() => ({ isChillMode: mounted ? isChillMode : false, setIsChillMode }), [isChillMode, setIsChillMode, mounted]);

  return (
    <ChillModeContext.Provider value={value}>
      {children}
    </ChillModeContext.Provider>
  );
}

function MUIThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme: nextTheme } = useTheme();
  const { isChillMode } = useChillMode();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: nextTheme === "dark" ? "dark" : "light",
          primary: {
            main: isChillMode
              ? (nextTheme === "dark" ? "#ef4444" : "#ef4444")
              : (nextTheme === "dark" ? "#3b82f6" : "#10b981"),
          },
          background: {
            default: isChillMode
              ? (nextTheme === "dark" ? "#000000" : "#fdfdfd")
              : (nextTheme === "dark" ? "#020617" : "#fdfdfd"),
            paper: isChillMode
              ? (nextTheme === "dark" ? "#000000" : "#ffffff")
              : (nextTheme === "dark" ? "#0f172a" : "#ffffff"),
          },
          error: {
            main: '#ef4444',
            light: '#fca5a5',
            dark: '#dc2626',
            contrastText: '#fff',
          },
        },
        shape: {
          borderRadius: 12,
        },
      }),
    [nextTheme, isChillMode]
  );

  if (!mounted) return <>{children}</>;

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppRouterCacheProvider>
      <NextThemesProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <ChillModeProvider>
          <MUIThemeProvider>{children}</MUIThemeProvider>
        </ChillModeProvider>
      </NextThemesProvider>   
    </AppRouterCacheProvider>
  );
}
