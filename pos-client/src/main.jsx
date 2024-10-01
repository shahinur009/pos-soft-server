import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { router } from './Routes/Routes.jsx'
import {
  RouterProvider,
} from "react-router-dom";
import AuthProvider from './provider/AuthProvider.jsx'



createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  </AuthProvider>,
)
