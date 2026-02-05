import { http } from './http';
/* =============================================================
     Resumen: Servicio unificado para invocar endpoints de administración:
                        usuarios, logs, categorías, productos, galería y mini slides.
                        Centraliza patrones de POST JSON, multipart y validación de respuestas.
     Diccionario:
         - FormData: API nativa para construir solicitudes multipart/form-data.
         - action: Parámetro query que selecciona operación en admin_panel.php.
         - mini slide: Bloque destacado (texto + imagen) mostrado en la página principal.
         - promote: Acción que altera el rol asignado a un usuario.
     ============================================================= */
export const adminService = {
    /**
     * Nombre de la función: logout
     * Proceso: Invoca endpoint de logout (GET) para invalidar la sesión actual.
     * Notas: No fuerza recarga; el caller decide navegación SPA.
     */
    async logout() {
        try {
            await http.get('/endpoints/logout.php');
        } catch {
            // Ignorar errores (si la sesión ya estaba caída no es crítico)
        }
        return true;
    },
    /**
    Nombre de la función: fetchAdmin
    Parámetros:
      - action (string): Nombre de la acción soportada por admin_panel.php.
      - data (object|FormData|null): Cuerpo JSON o FormData según necesidad.
    Proceso y salida: Selecciona método (GET/POST JSON/FormData) construyendo
      la URL base con el parámetro action. Retorna res.data o null si vacío.
    */
    async fetchAdmin(action, data = null) {
        const url = `/endpoints/admin_panel.php?action=${action}`;
        const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
        let res;
        if (isForm) {
            res = await http.postFormData(url, data);
        } else if (data) {
            res = await http.post(url, data);
        } else {
            res = await http.get(url);
        }
        return res?.data ?? null;
    },
    /* =============================
       USUARIOS (solo rol super)
       ============================= */
    /**
    Nombre de la función: listarUsuarios
    Parámetros: —
    Proceso y salida: GET a users.php?action=list. Retorna Array de
      usuarios (id, username, role, created_at). Lanza Error si falla.
    */
    async listarUsuarios() {
        const res = await http.get('/endpoints/users.php?action=list');
        if (!res?.success) throw new Error(res?.message || 'Error al listar usuarios');
        return res.data || [];
    },
    /**
    Nombre de la función: crearUsuario
    Parámetros: { username (string), password (string), role? ('user'|'super') }
    Proceso y salida: POST create; retorna { id } del nuevo usuario.
    */
    async crearUsuario({ username, password, role = 'user' }) {
        const res = await http.post('/endpoints/users.php?action=create', { username, password, role });
        if (!res?.success) throw new Error(res?.message || 'Error al crear usuario');
        return res.data;
    },
    /**
    Nombre de la función: cambiarContrasenaPropia
    Parámetros: currentPassword (string), newPassword (string)
    Proceso y salida: Cambia contraseña del usuario autenticado.
    */
    async cambiarContrasenaPropia(currentPassword, newPassword) {
        const res = await http.post('/endpoints/users.php?action=update_password', { current_password: currentPassword, new_password: newPassword });
        if (!res?.success) throw new Error(res?.message || 'Error al cambiar contraseña');
        return true;
    },
    /**
    Nombre de la función: forzarCambioContrasena (super)
    Parámetros: userId (number), newPassword (string)
    Proceso y salida: Fuerza cambio de contraseña de otro usuario. Retorna true.
    */
    async forzarCambioContrasena(userId, newPassword) {
        const res = await http.post('/endpoints/users.php?action=update_password', { user_id: userId, new_password: newPassword });
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar contraseña');
        return true;
    },
    /**
    Nombre de la función: cambiarRole (super)
    Parámetros: userId (number), role ('user'|'super')
    Proceso y salida: Actualiza rol; retorna true.
    */
    async cambiarRole(userId, role) {
        const res = await http.post('/endpoints/users.php?action=promote', { user_id: userId, role });
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar role');
        return true;
    },
    /* =============================
       LOGS (solo rol super)
       ============================= */
    /**
    Nombre de la función: obtenerLogs
    Parámetros: filtros { page?, per_page?, search?, action?, user?, from_date?, to_date? }
    Proceso y salida: GET logs.php con query construida por URLSearchParams.
      Retorna objeto paginado (items, page, per_page, total,...).
    */
    async obtenerLogs(filtros = {}) {
        const params = new URLSearchParams();
        for (const k of ['page','per_page','search','action','user','from_date','to_date']) {
            if (filtros[k] != null && filtros[k] !== '') params.set(k, filtros[k]);
        }
        const url = '/endpoints/logs.php' + (params.toString() ? ('?' + params.toString()) : '');
        const res = await http.get(url);
        if (!res?.success) throw new Error(res?.message || 'Error al obtener logs');
        return res.data;
    },

    /* =============================
       CATEGORÍAS
       ============================= */
    /**
    Nombre de la función: getCategorias
    Parámetros: —
    Proceso y salida: Obtiene lista de categorías. Retorna Array<{ id, nombre, catIcon_url? }>.
    */
    async getCategorias() {
    return this.fetchAdmin('get_categories', null);
    },

    /**
    Nombre de la función: crearCategoria
    Parámetros: nombre (string)
    Proceso y salida: POST add_category; retorna { id }.
    */
    async crearCategoria(nombre) {
    return this.fetchAdmin('add_category', { nombre });
    },

    /**
    Nombre de la función: eliminarCategoria
    Parámetros: id (number)
    Proceso y salida: POST delete_category; falla si hay productos. Retorna null.
    */
    async eliminarCategoria(id) {
    return this.fetchAdmin('delete_category', { id });
    },
    /**
    Nombre de la función: renombrarCategoria
    Parámetros: id (number), nombre (string)
    Proceso y salida: POST update_category_name; retorna null.
    */
    async renombrarCategoria(id, nombre) {
    return this.fetchAdmin('update_category_name', { id, nombre });
    },
    /**
    Nombre de la función: subirIconoCategoria
    Parámetros: categoriaId (number), archivo (File)
    Proceso y salida: POST multipart upload_category_icon; retorna { catIcon_url }.
    */
    async subirIconoCategoria(categoriaId, archivo) {
        const formData = new FormData();
        formData.append('categoria_id', categoriaId);
        formData.append('archivo', archivo);
    return this.fetchAdmin('upload_category_icon', formData);
    },

    /* =============================
       PRODUCTOS
       ============================= */
    /**
    Nombre de la función: getProductos
    Parámetros: —
    Proceso y salida: Lista de productos. Retorna Array<{ id, categoria_id, nombre, archivo, created_at? }>.
    */
    async getProductos() {
    return this.fetchAdmin('get_products', null);
    },

    /**
    Nombre de la función: crearProducto
    Parámetros: data { categoriaId (number), nombre (string), archivo (File PDF) }
    Proceso y salida: POST multipart add_product; retorna { id, archivo }.
    */
    async crearProducto(data) {
        const formData = new FormData();
        formData.append('action', 'add_product');
        formData.append('categoria_id', data.categoriaId);
        formData.append('nombre', data.nombre);
        formData.append('archivo', data.archivo);
    return this.fetchAdmin('add_product', formData);
    },

    /**
    Nombre de la función: reemplazarArchivo
    Parámetros: id (number), archivo (File PDF)
    Proceso y salida: POST multipart replace_product; retorna null en éxito.
    */
    async reemplazarArchivo(id, archivo) {
        const formData = new FormData();
        formData.append('action', 'replace_product');
        formData.append('producto_id', id);
        formData.append('archivo', archivo);
    return this.fetchAdmin('replace_product', formData);
    },

    /**
    Nombre de la función: eliminarProducto
    Parámetros: id (number)
    Proceso y salida: POST delete_product; retorna null.
    */
    async eliminarProducto(id) {
    return this.fetchAdmin('delete_product', { id });
    },
    /**
    Nombre de la función: renombrarProducto
    Parámetros: id (number), nombre (string)
    Proceso y salida: POST rename_product; retorna { archivo } actualizado.
    */
    async renombrarProducto(id, nombre) {
    return this.fetchAdmin('rename_product', { id, nombre });
    },
    /* =============================
       GALERÍA
       ============================= */
    /**
    Nombre de la función: subirGaleria
    Parámetros: { nombre (string), tipo ('foto'|'video'), archivo (File) }
    Proceso y salida: Sube elemento a galería; valida success del backend. Retorna objeto de respuesta completo.
    */
    async subirGaleria({ nombre, tipo, archivo }) {
        const formData = new FormData();
        formData.append('nombre', nombre);
        formData.append('tipo', tipo);
        formData.append('archivo', archivo);
        const resp = await http.postFormData('/endpoints/post_gallery.php', formData);
        if (!resp?.success) {
            const serverMsg = resp?.message || resp?.error || (resp?.authenticated === false ? (resp?.reason || 'No autorizado') : '');
            throw new Error(serverMsg || 'Error al subir archivo a galería');
        }
        return resp.data; // devolver directamente el item creado
    },

    /**
    Nombre de la función: obtenerGaleria
    Parámetros: tipo ('foto'|'imagen'|'video')
    Proceso y salida: GET get_gallery filtrado; retorna Array<GalleryItem>.
    */
    async obtenerGaleria(tipo) {
        const json = await http.get(`/endpoints/get_gallery.php?tipo=${tipo}`);
        if (!json?.success) {
            throw new Error(json?.message || 'Error al obtener galería');
        }
        return Array.isArray(json.data) ? json.data : [];
    },

    /**
    Nombre de la función: eliminarGaleria
    Parámetros: id (number)
    Proceso y salida: POST delete_gallery (multipart simple); retorna JSON backend.
    */
    async eliminarGaleria(id) {
        const formData = new FormData();
        formData.append('id', id);
        const json = await http.postFormData('/endpoints/delete_gallery.php', formData);
        if (!json?.success) {
            throw new Error(json?.message || 'Error al eliminar de galería');
        }
        return json;
    },
    /**
    Nombre de la función: renombrarGaleria
    Parámetros: id (number), nombre (string)
    Proceso y salida: POST a update_gallery; retorna respuesta del backend.
    */
    async renombrarGaleria(id, nombre) {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('nombre', nombre);
        const json = await http.postFormData('/endpoints/update_gallery.php', formData);
        if (!json?.success) {
            throw new Error(json?.message || 'Error al renombrar en galería');
        }
        return json;
    }
    ,
    /* =============================
       MINI SLIDES (admin)
       ============================= */
    /**
    Nombre de la función: listarMiniSlides
    Parámetros: —
    Proceso y salida: GET minislides?action=list; retorna Array de slides.
    */
    async listarMiniSlides() {
        const res = await http.get('/endpoints/minislides.php?action=list');
        if (!res?.success) throw new Error(res?.message || 'Error al listar mini slides');
        return res.data || [];
    },
    /**
    Nombre de la función: crearMiniSlide
    Parámetros: { text (string), image? (File), active? (boolean) }
    Proceso y salida: POST multipart create; retorna slide creado.
    */
    async crearMiniSlide({ text, image, active = true }) {
        const form = new FormData();
        form.append('text', text);
        form.append('active', active ? 1 : 0);
        if (image) form.append('image', image);
        const res = await http.postFormData('/endpoints/minislides.php?action=create', form);
        if (!res?.success) throw new Error(res?.message || 'Error al crear mini slide');
        return res.data;
    },
    /**
    Nombre de la función: actualizarMiniSlide
    Parámetros: { id (number), text? (string), image? (File), active? (boolean) }
    Proceso y salida: POST multipart update; retorna slide actualizado.
    */
    async actualizarMiniSlide({ id, text, image, active }) {
        const form = new FormData();
        form.append('id', id);
        if (text != null) form.append('text', text);
        if (image) form.append('image', image);
        if (active != null) form.append('active', active ? 1 : 0);
        const res = await http.postFormData('/endpoints/minislides.php?action=update', form);
        if (!res?.success) throw new Error(res?.message || 'Error al actualizar mini slide');
        return res.data;
    },
    /**
    Nombre de la función: eliminarMiniSlide
    Parámetros: id (number)
    Proceso y salida: POST JSON delete; retorna true si éxito.
    */
    async eliminarMiniSlide(id) {
        const res = await http.post('/endpoints/minislides.php?action=delete', { id });
        if (!res?.success) throw new Error(res?.message || 'Error al eliminar mini slide');
        return true;
    },
    /**
    Nombre de la función: reordenarMiniSlides
    Parámetros: order (Array<number>)
    Proceso y salida: POST JSON reorder; retorna true.
    */
    async reordenarMiniSlides(order) {
        const res = await http.post('/endpoints/minislides.php?action=reorder', { order });
        if (!res?.success) throw new Error(res?.message || 'Error al reordenar mini slides');
        return true;
    },
};