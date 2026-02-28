import { createBrowserRouter, RouterProvider } from 'react-router';
import { CatalogPage } from './features/catalog/CatalogPage';
import { AppDetailPage } from './features/detail/AppDetailPage';

const router = createBrowserRouter([
  { path: '/', element: <CatalogPage /> },
  { path: '/apps/:id', element: <AppDetailPage /> },
]);

export function App() {
  return <RouterProvider router={router} />;
}
