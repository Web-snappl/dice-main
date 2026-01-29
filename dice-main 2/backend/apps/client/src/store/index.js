// src/store/index.js
import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import rootSaga from './rootSaga'
import userReducer from './features/user/userSlice'
import globalReducer from './features/state/stateSlice'

const sagaMiddleware = createSagaMiddleware();

const store = configureStore({
    reducer: {
        global: globalReducer,
        user: userReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            thunk: false, // disable thunk since we're using saga
            serializableCheck: false, // optional: disable if you use non-serializable data (e.g., Date, Map)
        }).concat(sagaMiddleware),
});

sagaMiddleware.run(rootSaga)

export default store