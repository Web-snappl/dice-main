// src/store/state/stateSlice
import { createSlice } from '@reduxjs/toolkit'
import { lightTheme, darkTheme } from '@theme/theme.ts'

const globalSlice = createSlice({
    name: 'global',
    initialState: {
        themes: {
            activeTheme: 'light',
            light: lightTheme,
            dark: darkTheme
        },
        navbarPageNum: 1,
        language: 'en',
        sidebarOpen: true,
        notifications: [],
        loading: false,
    },
    reducers: {
        setTheme: (state, action) => {
            state.themes = { ...state.themes, activeTheme: action.payload }
        },
        setNavbarPageNum: (state, action) => {
            state.navbarPageNum = action.payload
        },
        setLanguage: (state, action) => {
            state.language = action.payload;
        },
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen
        },
        openSidebar: (state) => {
            state.sidebarOpen = true
        },
        closeSidebar: (state) => {
            state.sidebarOpen = false
        },
        setLoadingGlobal: (state, action) => {
            state.isLoadingGlobal = action.payload
        }
    },
});

export const {
    setTheme,
    setNavbarPageNum,
    setLanguage,
    toggleSidebar,
    openSidebar,
    closeSidebar,
    addNotification,
    removeNotification,
    setLoadingGlobal,
} = globalSlice.actions;

export default globalSlice.reducer