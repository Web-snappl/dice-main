import { showToast } from '../toast'
import { ApiClient } from './api'

//const env = import.meta.env
//const NODE_ENV = env.VITE_NODE_ENV || 'production'
const REMOTE_URL = 'https://immo-627497957398.europe-west1.run.app'

class AuthApiClient extends ApiClient {
    constructor() {
        super(`${REMOTE_URL}/api/auth`)
    }

    signIn = async (email, password) => {
        const endpoint = `/emailLogin?email=${email}&password=${password}`
        const { data, error } = await this.get(endpoint)
        if (error) this.prompt(error)
        return { data, error }
    }

    signUp = async (email, password, displayName, role) => {
        const endpoint = '/emailSignUp'
        const { data, error } = await this.post(endpoint, {
            email: email,
            password: password,
            displayName: displayName,
            role: role
        })

        if (error) this.prompt(error)
        return { data, error }
    }

    emailVerification = async (vCode) => {
        const endpoint = `/emailVerification`
        const { data, error } = await this.post(endpoint, {
            verificationCode: vCode
        })
        if (error) showToast('error', error.message, 'dark')
        return { data, error }
    }

    forgotPassword = async (email, password, confirmPassword) => {
        const endpoint = `/forgotPassword`
        const { data, error } = await this.post(endpoint, {
            email: email,
            newPassword: password,
            confirmPassword: confirmPassword
        })
        if (error) this.prompt(error)
        return { data, error }
    }

    resetPassword = async (mongoDbId, newPassword) => {
        const endpoint = `/resetPassword`
        const { data, error } = await this.post(endpoint, {
            uid: mongoDbId,
            password: newPassword
        })
        if (error) this.prompt(error)
        return { data, error }
    }

}

export const authApi = new AuthApiClient()


