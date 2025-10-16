import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';


type Theme = 'light' | 'dark';


interface ThemeContextType {
  theme: Theme;
  colors: typeof Colors.light;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}


export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<Theme>(deviceColorScheme || 'light');

  useEffect(() => {
    setThemeState(deviceColorScheme || 'light');
  }, [deviceColorScheme]);

  const toggleTheme = () => {
    setThemeState(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  const colors = theme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, colors, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}


export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};