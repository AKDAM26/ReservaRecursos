import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from './shell/AppShell.jsx'
import { RequireAuth } from './shell/RequireAuth.jsx'
import { RequireRole } from './shell/RequireRole.jsx'
import { LoginPage } from '../pages/auth/LoginPage.jsx'
import { RegisterPage } from '../pages/auth/RegisterPage.jsx'
import { CalendarPage } from '../pages/calendar/CalendarPage.jsx'
import { HomePage } from '../pages/home/HomePage.jsx'
import { MyReservationsPage } from '../pages/reservations/MyReservationsPage.jsx'
import { ResourcesPage } from '../pages/resources/ResourcesPage.jsx'
import { TypesPage } from '../pages/types/TypesPage.jsx'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/app/inicio" replace /> },
      { path: 'inicio', element: <HomePage /> },
      { path: 'calendario', element: <CalendarPage /> },
      { path: 'mis-reservas', element: <MyReservationsPage /> },
      {
        path: 'recursos',
        element: (
          <RequireRole allow={['admin']}>
            <ResourcesPage />
          </RequireRole>
        ),
      },
      {
        path: 'tipos',
        element: (
          <RequireRole allow={['admin']}>
            <TypesPage />
          </RequireRole>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/app" replace />,
  },
])

