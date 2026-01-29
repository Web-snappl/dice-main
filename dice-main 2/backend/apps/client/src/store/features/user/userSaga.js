import { call, put, takeEvery } from 'redux-saga/effects'
import { fetchUserSuccess, fetchUserFailure } from './userSlice'
import { UserSchema } from '../../../schemas/userSchema'
import { z } from 'zod'

// API function
const fetchUserApi = async (userId) => {
    const res = await fetch(`https://jsonplaceholder.typicode.com/users/${userId}`);
    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`)
    }
    return res.json()
}

function* handleFetchUser(action) {
    try {
        const rawData = yield call(fetchUserApi, action.payload);

        const parsedUser = UserSchema.parse(rawData)

        yield put(fetchUserSuccess(parsedUser))
    } catch (e) {
        let errorMessage = { cause: 'redux store/features/user/userSaga: Failed to fetch or validate user data' }

        // Handle Zod validation errors
        if (e instanceof z.ZodError) {
            errorMessage = { cause: `redux store/features/user/userSaga: Zod validation error: ${e}` }
        }

        yield put(fetchUserFailure(errorMessage))
    }
}

export function* watchFetchUser() {
    yield takeEvery('user/fetchUserRequest', handleFetchUser)
}