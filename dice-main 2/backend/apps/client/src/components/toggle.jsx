// components/ThemeToggle.js
import { useDispatch, useSelector } from 'react-redux'
import { setTheme } from '@store/features/state/stateSlice'

const ThemeToggle = () => {
    const dispatch = useDispatch()
    const currentTheme = useSelector((state) => state.global.theme)

    const toggleTheme = () => {
        dispatch(setTheme(currentTheme === 'light' ? 'dark' : 'light'))
    }

    return (
        <button onClick={toggleTheme}>
            Switch to {currentTheme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
    );
}

export default ThemeToggle