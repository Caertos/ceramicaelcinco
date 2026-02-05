import { useCallback } from 'react';

/* =============================================================
   Hook: useCategoriesOperations
   Resumen: Hook especializado para operaciones CRUD de categorías con gestión de errores y confirmaciones.
   Diccionario:
     - CRUD: Create, Read, Update, Delete - operaciones básicas de base de datos.
     - ConfirmDialog: Modal de confirmación para operaciones destructivas.
     - runBlocking: Wrapper que muestra loader durante operación.
     - cargarDatos: Función que refresca el estado después de cambios.
   Funciones:
     - handleCrearCategoria(e, nombre, setter): Crea nueva categoría y limpia form.
     - handleEliminarCategoria(id, nombre, setConfirmCfg, setConfirmOpen): Configura confirmación de eliminación.
     - handleRenombrarCategoria(id, nombre): Actualiza nombre de categoría existente.
     - handleSubirIconoCategoria(id, archivo): Sube/actualiza ícono de categoría.
   ============================================================= */
// Nombre de la función: useCategoriesOperations
// Parámetros: { adminService, mostrarMensaje, cargarDatos, runBlocking }
// Proceso y salida: Proporciona handlers optimizados para todas las operaciones CRUD de categorías con error handling.
export const useCategoriesOperations = ({ 
  adminService, 
  mostrarMensaje, 
  cargarDatos, 
  runBlocking 
}) => {
  const handleCrearCategoria = useCallback(async (e, nuevaCategoria, setNuevaCategoria) => {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    
    await runBlocking(async () => {
      try {
        await adminService.crearCategoria(nuevaCategoria.trim());
        setNuevaCategoria('');
        mostrarMensaje('Categoría creada');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  const handleEliminarCategoria = useCallback(async (id, nombre, setConfirmCfg, setConfirmOpen) => {
    setConfirmCfg({
      title: 'Eliminar categoría',
      message: `¿Eliminar la categoría "${nombre || id}"?`,
      onConfirm: async () => {
        setConfirmCfg(c => ({ ...c, loading: true }));
        await runBlocking(async () => {
          try { 
            await adminService.eliminarCategoria(id); 
            mostrarMensaje('Categoría eliminada'); 
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

  const handleRenombrarCategoria = useCallback(async (id, nombre) => {
    if (!nombre) return;
    await runBlocking(async () => {
      try {
        await adminService.renombrarCategoria(id, nombre);
        mostrarMensaje('Categoría renombrada');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  const handleSubirIconoCategoria = useCallback(async (id, archivo) => {
    if (!archivo) return;
    await runBlocking(async () => {
      try {
        await adminService.subirIconoCategoria(id, archivo);
        mostrarMensaje('Ícono de categoría actualizado');
        cargarDatos();
      } catch (e) { 
        mostrarMensaje(e.message, 'error'); 
      }
    });
  }, [adminService, mostrarMensaje, cargarDatos, runBlocking]);

  return {
    handleCrearCategoria,
    handleEliminarCategoria,
    handleRenombrarCategoria,
    handleSubirIconoCategoria
  };
};