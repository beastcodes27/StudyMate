import React, { createContext, useState, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDarkTheme, setIsDarkTheme] = useState(systemScheme === 'dark');

    const toggleTheme = () => {
        setIsDarkTheme(prev => !prev);
    };

    const theme = {
        isDark: isDarkTheme,
        colors: isDarkTheme ? {
            background: '#121212',
            text: '#FFFFFF',
            card: '#1E1E1E',
            border: '#2C2C2C',
            primary: '#BB86FC',
            notification: '#FF80AB',
        } : {
            background: '#FFFFFF',
            text: '#000000',
            card: '#F5F5F5',
            border: '#E0E0E0',
            primary: '#6200EE',
            notification: '#F50057',
        },
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
