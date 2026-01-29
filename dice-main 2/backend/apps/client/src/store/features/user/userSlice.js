import { createSlice } from '@reduxjs/toolkit'

const userSlice = createSlice({
    name: 'user',
    initialState: {
        data: null,
        loading: false,
        error: null,
    },
    reducers: {
        fetchUserRequest: (state) => {
            state.loading = true;
            state.error = null;
        },
        fetchUserSuccess: (state, action) => {
            state.loading = false;
            state.data = action.payload;
        },
        fetchUserFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },

        setUser: (state, action) => {
            state.data = action.payload;
        }
    },
})

export const { fetchUserRequest, fetchUserSuccess, fetchUserFailure, setUser } = userSlice.actions

export default userSlice.reducer
