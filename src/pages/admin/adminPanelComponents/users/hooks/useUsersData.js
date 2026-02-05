import { useState, useEffect, useCallback } from 'react';

/* =============================================================
   Hook: useUsersData
   Resumen: Hook para gestionar la carga y actualización de la lista de usuarios del sistema.
   Diccionario:
     - users: Lista completa de usuarios del sistema.
     - loading: Estado de carga durante fetch inicial.
     - cargar: Función para recargar lista desde API.
     - adminService: Servicio que proporciona métodos de gestión de usuarios.
   Funciones:
     - cargar(): Carga asíncrona de usuarios con manejo de errores.
     - useEffect inicial: Carga automática al montar el componente.
   ============================================================= */
// Nombre de la función: useUsersData
// Parámetros: { adminService, mostrarMensaje }
// Proceso y salida: Gestiona estado de usuarios con carga inicial, recarga manual y manejo de errores integrado.
export const useUsersData = ({ adminService, mostrarMensaje }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.listarUsuarios();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {
      mostrarMensaje(e.message, 'error');
    } finally { 
      setLoading(false); 
    }
  }, [adminService, mostrarMensaje]);

  useEffect(() => { 
    cargar(); 
  }, [cargar]);

  return {
    users,
    loading,
    cargar
  };
};