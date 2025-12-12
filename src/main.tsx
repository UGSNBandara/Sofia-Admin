import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './ui/App';
import Items from './ui/Items';
import Orders from './ui/Orders';
import Dashboard from './ui/Dashboard';
import './ui/base.css';
import './ui/mobile-overrides.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Items /> },
      { path: 'orders', element: <Orders /> },
      { path: 'dashboard', element: <Dashboard /> },
    ],
  },
]);

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
