// src/theme/theme.ts

export interface ThemeType {
    primary: string;
    secondary: string;
    subTextPrimary: string;
    subTextSecondary: string;
    text: string;
    textNumColor: string;
    icon: string;
    divider: string
}

export const lightTheme: ThemeType = {
    primary: '#F9F9F9',
    secondary: '#F9F9F9',
    subTextPrimary: '#5F555F',
    subTextSecondary: '#8B7A7A',
    text: '#222',
    textNumColor: 'black',
    icon: '#222',
    divider: '#EEEEEE'
}

export const darkTheme: ThemeType = {
    primary: '#121214',
    secondary: '#1A1A1E',
    subTextPrimary: '#CFC2CF',
    subTextSecondary: '#A89EA8',
    text: '#FFFFFF',
    textNumColor: 'white',
    icon: 'white',
    divider: '#333333'
}

