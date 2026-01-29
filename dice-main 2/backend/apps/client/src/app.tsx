import { AppRouter } from "@routes"
import { useSelector } from "react-redux"

function App() {

  const roles = ['admin'] // get from redux
  const themes = useSelector((state: any) => state.global.themes)
  const themeColor = themes.activeTheme === 'light' ? themes?.light?.primary : themes?.dark?.primary

  return (
    <main style={{ backgroundColor: themeColor }} >
      <AppRouter
        isAuthenticated={false}
        userPermissions={roles}
      />
    </main>
  )
}

export default App
