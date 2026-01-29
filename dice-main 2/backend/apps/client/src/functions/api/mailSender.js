import { ApiClient } from './api'

//const env = import.meta.env
//const NODE_ENV = env.VITE_NODE_ENV || 'production'
const REMOTE_URL = 'https://immo-627497957398.europe-west1.run.app'

class EmailApiClient extends ApiClient {
    constructor() {
        super(`${REMOTE_URL}/api/mailsender`)
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
            email: mongoDbId,
            password: newPassword
        })
        if (error) this.prompt(error)
        return { data, error }
    }

}

export const mailSenderApi = new EmailApiClient()
