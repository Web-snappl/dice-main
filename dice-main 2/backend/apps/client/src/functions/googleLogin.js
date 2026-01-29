import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { getAuth } from "firebase/auth"
import { showToast } from "./toast"
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from "./firebaseConfig.js"

export const ContinueWithGoogle = async () => {

    if (!getApps().length) initializeApp(firebaseConfig)

    const provider = new GoogleAuthProvider()
    const auth = getAuth()
    auth.languageCode = 'en'

    try {
        const result = await signInWithPopup(auth, provider)
        const user = result.user
        return {user:user, error:null}
    } catch (error) {
        showToast('error', error.code, 'dark')
        showToast('error', error.message, 'dark')
        return { user: null, error: error }
    }
}

