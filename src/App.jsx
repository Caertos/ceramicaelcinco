import { Routes, Route } from 'react-router-dom';

import { Suspense, lazy } from 'react';
import ProtectedRoute from './components/protectedRoute/ProtectedRoute';
// Lazy imports para reducir el bundle inicial y cargar vistas bajo demanda
const Home = lazy(() => import('./pages/home/Home'));
const About = lazy(() => import('./pages/about/About'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductionProcess = lazy(() => import('./pages/productionProcess/productionProcess'));
const Contact = lazy(() => import('./pages/contact/Contact'));
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'));
const NotFound = lazy(() => import('./pages/notFound/NotFound'));

import './App.css'
const Gallery = lazy(() => import('./pages/gallery/Gallery'));
const Login = lazy(() => import('./pages/login/Login'));

/* =============================================================
   Resumen: Define el árbol de rutas principales de la SPA conectando
            paths con páginas React y protegiendo /admin mediante
            <ProtectedRoute>.
   Diccionario:
     - Route: Componente de React Router que asocia una URL (path) con un componente (element) a renderizar.
     - fallback: Prop de <Suspense> que define el contenido mostrado mientras se cargan componentes lazy.
     - lazy(): Función de React que permite cargar componentes bajo demanda (code splitting) para optimizar el rendimiento.
     - ProtectedRoute: Componente que verifica autenticación antes de
       permitir acceso a rutas administrativas.
   Proceso y salida: Devuelve <Routes> con mapping path->element. Rutas
     desconocidas caen en NotFound. Exporta componente raíz de routing.
   ============================================================= */
function App() {
  return (
        <Suspense fallback={<div style={{padding:'2rem'}}>Cargando…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/products" element={<Products />} />
          <Route path="/process" element={<ProductionProcess />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPanel />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
  );
}

export default App
