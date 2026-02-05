import { useCallback } from 'react';

/* =============================================================
   Hook: useProductsOperations
   Resumen: Hook especializado para operaciones CRUD de productos con manejo de archivos y validaciones.
   Diccionario:
     - CRUD: Create, Read, Update, Delete - operaciones básicas de productos.
     - archivo: File object para PDFs/imágenes asociados al producto.
     - reemplazarArchivo: Operación para actualizar archivo sin cambiar metadatos del producto.
     - ConfirmDialog: Modal de confirmación para eliminaciones.
   Funciones:
     - handleCrearProducto(e, producto, setter): Crea producto con archivo y limpia form.
     - handleReemplazarArchivo(id, archivo): Actualiza solo el archivo del producto.
     - handleEliminarProducto(id, nombre, setConfirmCfg, setConfirmOpen): Configura confirmación de eliminación.
     - handleRenombrarProducto(id, nombre): Actualiza nombre del producto.
   ============================================================= */
// Nombre de la función: useProductsOperations
// Parámetros: { adminService, mostrarMensaje, cargarDatos, runBlocking }
// Proceso y salida: Proporciona handlers para operaciones CRUD de productos incluyendo gestión de archivos.
export const useProductsOperations = ({ 
  adminService, 
  mostrarMensaje, 
  cargarDatos, 
  runBlocking 
}) => {
  const handleCrearProducto = useCallback(async (e, nuevoProducto, setNuevoProducto) => {
    e.preventDefault();
    if (!nuevoProducto.categoria_id || !nuevoProducto.nombre || !nuevoProducto.archivo) return;
    
    await runBlocking(async () => {
      try {
        await adminService.crearProducto({
          categoriaId: nuevoProducto.categoria_id,
          nombre: nuevoProducto.nombre,
          archivo: nuevoProducto.archivo
        });
        setNuevoProducto({ categoria_id: '', nombre: '', archivo: null });
        mostrarMensaje('Producto creado');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  const handleReemplazarArchivo = useCallback(async (id, archivo) => {
    if (!archivo) return;
    await runBlocking(async () => {
      try {
        await adminService.reemplazarArchivo(id, archivo);
        mostrarMensaje('Archivo reemplazado');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  const handleEliminarProducto = useCallback(async (id, nombre, setConfirmCfg, setConfirmOpen) => {
    setConfirmCfg({
      title: 'Eliminar producto',
      message: `¿Eliminar el producto "${nombre || id}"?`,
      onConfirm: async () => {
        setConfirmCfg(c => ({ ...c, loading: true }));
        await runBlocking(async () => {
          try { 
            await adminService.eliminarProducto(id); 
            mostrarMensaje('Producto eliminado'); 
            cargarDatos(); 
          } catch (e) { 
            mostrarMensaje(e.message, 'error'); 
          } finally { 
            setConfirmCfg(c => ({ ...c, loading: false })); 
            setConfirmOpen(false); 
          }
        });
      }
    });
    setConfirmOpen(true);
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  const handleRenombrarProducto = useCallback(async (id, nombre) => {
    if (!nombre) return;
    await runBlocking(async () => {
      try {
        await adminService.renombrarProducto(id, nombre);
        mostrarMensaje('Producto renombrado');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  return {
    handleCrearProducto,
    handleReemplazarArchivo,
    handleEliminarProducto,
    handleRenombrarProducto
  };
};