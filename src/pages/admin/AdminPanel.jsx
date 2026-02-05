import React, { useState, useEffect, useCallback } from 'react';
import { useDeferredLoader } from '../../hooks/useDeferredLoader';
import { useMessages } from './hooks/useMessages';
import { useSessionPolling } from './hooks/useSessionPolling';
import { useBlockingOperations } from './hooks/useBlockingOperations';
import { useCategoriesOperations } from './hooks/useCategoriesOperations';
import { useProductsOperations } from './hooks/useProductsOperations';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/useAuth.js';
import useLogout from '../../hooks/useLogout.js';
import Loader from '../../components/common/Loader';
import ConfirmDialog from '../../components/common/ConfirmDialog';

import Sidebar from './adminPanelComponents/sidebar/Sidebar';
import AdminHeader from './adminPanelComponents/header/AdminHeader';
import AdminMessagesDisplay from './adminPanelComponents/messages/AdminMessagesDisplay';
import CategoriesSection from './adminPanelComponents/categories/CategoriesSection';
import ProductsSection from './adminPanelComponents/products/ProductsSection';
import GallerySection from './adminPanelComponents/gallery/GallerySection';
import UsersSection from './adminPanelComponents/users/UsersSection';
import LogsSection from './adminPanelComponents/logs/LogsSection';
import MiniSlidesSection from './adminPanelComponents/minislides/MiniSlidesSection';
import Banner from '../../components/banner/Banner';

import './adminPanel.css';

/* =============================================================
   Componente: AdminPanel (Refactorizado)
   Resumen: Panel de administración multi-sección con arquitectura modular usando hooks personalizados para separación de responsabilidades.
   Diccionario:
     - vista: Sección activa del panel (categorias, productos, galeria, minislides, usuarios, logs).
     - productosByCat: Mapa que agrupa productos por categoria_id para renderizado eficiente.
     - runBlocking: Wrapper de operaciones que muestra loader durante ejecución.
     - polling inteligente: Renovación de sesión solo si hay actividad del usuario.
     - hooks modulares: Lógica extraída en hooks reutilizables para mantenibilidad.
   Funciones:
     - cargarDatos(): Carga inicial y refresco de categorías/productos desde API.
     - Handlers via hooks: Operaciones CRUD delegadas a hooks especializados.
   ============================================================= */
// Nombre de la función: AdminPanel
// Parámetros: (ninguno) - Usa contextos y servicios internos
// Proceso y salida: 
// 1. Monta: Inicializa hooks modulares (mensajes, polling, operaciones).
// 2. Carga: Obtiene datos iniciales y configura estado de vista persistente.
// 3. Coordina: Gestiona comunicación entre hooks y secciones del panel.
// 4. Renderiza: Layout responsivo con sidebar, header modular y secciones dinámicas.
// Mejoras de refactorización: Código más mantenible, testeable y reutilizable.
const AdminPanel = () => {
    // --- Estado general ---
    const [categorias, setCategorias] = useState([]);
    const [productosByCat, setProductosByCat] = useState({});
    const { showLoader: showInitialLoader, start: startInitialLoader, stop: stopInitialLoader } = useDeferredLoader();
    
    // Hooks personalizados
    const { message, mostrarMensaje } = useMessages();
    const { showBlockingLoader, runBlocking } = useBlockingOperations();
    // Vista actual (persistida en sessionStorage)
    const [vista, setVista] = useState(() => {
        try { return sessionStorage.getItem('admin_vista') || 'categorias'; } catch { return 'categorias'; }
    }); // categorias | productos | galeria | minislides | usuarios | logs
    useEffect(() => {
        try { sessionStorage.setItem('admin_vista', vista); } catch { /* ignore */ }
    }, [vista]);

    // Categoría seleccionada en sección Productos (persistida)
    const [catSeleccionadaProductos, setCatSeleccionadaProductos] = useState(() => {
        try { const v = sessionStorage.getItem('admin_products_cat'); return v ? Number(v) : null; } catch { return null; }
    });
    useEffect(() => {
        if (catSeleccionadaProductos != null) {
            try { sessionStorage.setItem('admin_products_cat', String(catSeleccionadaProductos)); } catch { /* ignore */ }
        }
    }, [catSeleccionadaProductos]);
    const { role, refreshAuth } = useAuth();
    const doLogout = useLogout();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmCfg, setConfirmCfg] = useState({ title: '', message: '', onConfirm: null, loading: false });

    // Formularios / datos compartidos
    const [nuevaCategoria, setNuevaCategoria] = useState('');
    const [nuevoProducto, setNuevoProducto] = useState({ categoria_id: '', nombre: '', archivo: null });



        // Cargar categorías y productos (compartido entre secciones)
        const cargarDatos = useCallback(async () => {
            try {
                startInitialLoader();
                const categoriasData = await adminService.getCategorias();
                const productosData = await adminService.getProductos();
                const cats = Array.isArray(categoriasData) ? categoriasData : [];
                setCategorias(cats);
                const agrupado = {};
                if (Array.isArray(productosData)) {
                    productosData.forEach(p => {
                        if (!p || !p.categoria_id) return;
                        (agrupado[p.categoria_id] ||= []).push(p);
                    });
                }
                setProductosByCat(agrupado);
                // Validar categoría seleccionada (si fue eliminada seleccionar primera disponible)
                // Normalizamos a número para comparar (API puede devolver id string y estado guardado numérico o viceversa)
                if (catSeleccionadaProductos != null && !cats.find(c => Number(c.id) === Number(catSeleccionadaProductos))) {
                    const nueva = cats[0]?.id ?? null;
                    setCatSeleccionadaProductos(nueva);
                }
            } catch {
                mostrarMensaje('Error al cargar los datos', 'error');
            } finally {
                stopInitialLoader();
            }
        }, [startInitialLoader, stopInitialLoader, catSeleccionadaProductos, mostrarMensaje]);

        useEffect(() => { cargarDatos(); }, [cargarDatos]);

        // Hooks para operaciones
        const categoriesHandlers = useCategoriesOperations({
            adminService,
            mostrarMensaje,
            cargarDatos,
            runBlocking
        });

        const productsHandlers = useProductsOperations({
            adminService,
            mostrarMensaje,
            cargarDatos,
            runBlocking
        });

        // Wrappers para handlers que necesitan parámetros específicos
        const handleCrearCategoria = useCallback((e) => {
            categoriesHandlers.handleCrearCategoria(e, nuevaCategoria, setNuevaCategoria);
        }, [categoriesHandlers, nuevaCategoria]);

        const handleEliminarCategoria = useCallback((id, nombre) => {
            categoriesHandlers.handleEliminarCategoria(id, nombre, setConfirmCfg, setConfirmOpen);
        }, [categoriesHandlers]);

        const handleRenombrarCategoria = categoriesHandlers.handleRenombrarCategoria;
        const handleSubirIconoCategoria = categoriesHandlers.handleSubirIconoCategoria;

        const handleCrearProducto = useCallback((e) => {
            productsHandlers.handleCrearProducto(e, nuevoProducto, setNuevoProducto);
        }, [productsHandlers, nuevoProducto]);

        const handleEliminarProducto = useCallback((id, nombre) => {
            productsHandlers.handleEliminarProducto(id, nombre, setConfirmCfg, setConfirmOpen);
        }, [productsHandlers]);

        const handleReemplazarArchivo = productsHandlers.handleReemplazarArchivo;
        const handleRenombrarProducto = productsHandlers.handleRenombrarProducto;

        // --- Polling de sesión con detección de actividad ---
        useSessionPolling({ 
            role, 
            refreshAuth, 
            mostrarMensaje 
        });

    if (showInitialLoader) return <Loader message="Cargando panel…" />;

        return (
            <>
            <Banner
                bannerImg="/galleryBanner.webp"
                bannerAlt={"Banner Panel de Administración Ceramica el Cinco"}
            />
            <div className="admin-wrapper layout-split" aria-busy={showBlockingLoader}>
                {showBlockingLoader && <Loader message="Procesando…" />}
                <Sidebar current={vista} onChange={setVista} isSuper={role === 'super'} />
                <section className="admin-container">
                    <AdminHeader onLogout={doLogout} />
                    <AdminMessagesDisplay message={message} />
                    {vista === 'categorias' && (
                        <CategoriesSection
                            categorias={categorias}
                            productosByCat={productosByCat}
                            onCrear={handleCrearCategoria}
                            onEliminar={handleEliminarCategoria}
                            nuevaCategoria={nuevaCategoria}
                            setNuevaCategoria={setNuevaCategoria}
                            onRenombrar={handleRenombrarCategoria}
                            onSubirIcono={handleSubirIconoCategoria}
                        />
                    )}
                    {vista === 'productos' && (
                        <ProductsSection
                            categorias={categorias}
                            productosByCat={productosByCat}
                            nuevoProducto={nuevoProducto}
                            setNuevoProducto={setNuevoProducto}
                            onCrear={handleCrearProducto}
                            onEliminar={handleEliminarProducto}
                            onReemplazar={handleReemplazarArchivo}
                            onRenombrar={handleRenombrarProducto}
                            catActiva={catSeleccionadaProductos}
                            setCatActiva={setCatSeleccionadaProductos}
                        />
                    )}
                    {vista === 'galeria' && (
                        <GallerySection
                            mostrarMensaje={mostrarMensaje}
                            adminService={adminService}
                        />
                    )}
                    {vista === 'minislides' && (
                        <MiniSlidesSection
                            adminService={adminService}
                            mostrarMensaje={mostrarMensaje}
                        />
                    )}
                    {vista === 'usuarios' && role === 'super' && (
                        <UsersSection adminService={adminService} mostrarMensaje={mostrarMensaje} />
                    )}
                    {vista === 'logs' && role === 'super' && (
                        <LogsSection adminService={adminService} mostrarMensaje={mostrarMensaje} />
                    )}
                </section>
            </div>
            <ConfirmDialog
                open={confirmOpen}
                title={confirmCfg.title}
                message={confirmCfg.message}
                confirmText="Eliminar"
                cancelText="Cancelar"
                loading={confirmCfg.loading}
                onCancel={() => { if (!confirmCfg.loading) setConfirmOpen(false); }}
                onConfirm={() => confirmCfg.onConfirm?.()}
            />
            </>
        );
    };

export default AdminPanel;
