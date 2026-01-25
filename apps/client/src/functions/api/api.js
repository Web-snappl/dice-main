import axios from 'axios'
import { showToast } from '@functions/toast'

export class ApiClient {
    constructor(baseURL, timeout = 3000) {
        this.axiosInstance = axios.create({
            baseURL,
            timeout: timeout,
            headers: { 'Content-Type': 'application/json', Authorization: 'quJTa6SEDnn4tSlA' },
        })
        this.baseURL = baseURL
    }

    get = async (endpoint) => {
        try {
            const response = await this.axiosInstance.get(`${this.baseURL}${endpoint}`)
            return { data: response.data, error: undefined }
        } catch (error) {
            console.error(`GET ${endpoint} failed:`,error.response ? error.response?.data : error)
            return { data: undefined, error: error?.response?.data }
        }
    }

    post = async (endpoint, data) => {
        try {
            const response = await this.axiosInstance.post(`${this.baseURL}${endpoint}`, data)
            return { data: response.data, error: undefined }
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error.response ? error.response?.data : error)
            return { data: undefined, error: error?.response?.data }
        }
    }
    prompt = (error) => {
        if (error.message && typeof error.message === 'string') {
            showToast('error', error.message, 'light')
        } else if (error.message && Array.isArray(error.message)) {
            error.message.forEach((msg) => showToast('error', msg, 'light'))
        } else {
            showToast('error', `An unexpected error occurred \n
                error: ${error.error || 'unknown'} \n
                status: ${error.status || error.statusCode || 'unknown'}`,
                'light'
            )
        }
    }
}
