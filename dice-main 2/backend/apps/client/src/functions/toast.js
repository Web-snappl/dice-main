import { toast, Bounce } from 'react-toastify'

const options = (theme) => {
    return {
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: theme,
        transition: Bounce
    }
}

export const showToast = (type, message, theme) => {
    switch (type) {
        case 'info':
            toast.info(message, options(theme))
            break;
        case 'success':
            toast.success(message, options(theme))
            break;
        case 'warning':
            toast.warning(message, options(theme))
            break;
        case 'error':
            toast.error(message, options(theme))
            break;
        default:
            toast.error('Invalid toast type', options(theme));
    }
}
