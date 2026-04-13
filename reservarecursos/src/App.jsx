import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from './app/auth/AuthProvider.jsx'
import { router } from './app/router.jsx'

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
