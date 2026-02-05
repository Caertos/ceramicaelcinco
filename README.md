# 🏺 Cerámica El Cinco - Aplicación Web Empresarial

> Aplicación web full-stack para empresa de fabricación de productos cerámicos. Desarrollada con React + Vite en el frontend y PHP para el backend.

## 📋 Descripción del Proyecto

Aplicación web empresarial completa que incluye:
- **Sitio público**: Catálogo de productos, galería multimedia, información corporativa
- **Panel de administración**: CRUD completo para gestión de contenidos
- **Sistema de autenticación**: Control de acceso con diferentes roles

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** - Biblioteca UI moderna
- **Vite 7** - Build tool y dev server ultra-rápido
- **React Router 7** - Navegación SPA avanzada
- **CSS3** - Estilos modulares con design tokens

### Backend
- **PHP 8+** - Lógica del servidor
- **MySQL** - Base de datos
- **REST API** - Arquitectura de endpoints

### Seguridad
- Autenticación basada en sesiones
- Protección CSRF
- Rate limiting en login
- Validación de archivos
- Headers de seguridad (CSP, CORS, etc.)

## ✨ Características Principales

### Público
- 📱 **Responsive Design** - Adaptado para móviles, tablets y desktop
- 🖼️ **Galería Multimedia** - Gestión de imágenes y videos
- 📄 **Catálogo de Productos** - Visualización de PDFs con categorización
- 🎨 **Carrusel Dinámico** - Mini-slides en página principal
- 📞 **Formulario de Contacto** - Con protección anti-spam

### Administración
- 👥 **Gestión de Usuarios** - Roles (usuario/superusuario)
- 📂 **CRUD de Categorías** - Con soporte para iconos
- 📑 **CRUD de Productos** - Subida y gestión de PDFs
- 🎬 **CRUD de Galería** - Imágenes y videos
- 📊 **Sistema de Logs** - Auditoría de acciones
- 🔐 **Sesiones Seguras** - Control de timeouts y renovación

## 📁 Estructura del Proyecto

```
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/          # Páginas principales
│   ├── services/       # Servicios HTTP
│   ├── hooks/          # Custom hooks
│   ├── context/        # Context API
│   └── styles/         # Estilos globales
├── endpoints/          # Backend PHP
├── public/             # Assets estáticos
└── config/             # Configuración
```

## 🚀 Highlights Técnicos

### Arquitectura Frontend
- **Component-based architecture** con separación de responsabilidades
- **Custom hooks** para lógica reutilizable
- **Context API** para gestión de estado de autenticación
- **Lazy loading** de componentes para optimización

### Backend
- **Arquitectura REST** con endpoints especializados
- **Validación robusta** de inputs y archivos
- **Gestión de sesiones** con timeouts configurables
- **Sistema de logging** para auditoría

### Optimizaciones
- **Compresión de imágenes** a WebP
- **Lazy loading** de imágenes
- **Cache headers** para assets estáticos
- **Lighthouse Score**: 90+ en rendimiento

### Seguridad Implementada
- Protección CSRF en todas las operaciones
- Rate limiting adaptativo en login
- Validación estricta de tipos MIME
- Sanitización de inputs
- Headers de seguridad completos

## 📊 Métricas del Código

- **Componentes React**: 40+
- **Endpoints PHP**: 15+
- **Custom Hooks**: 12+
- **Líneas de código**: ~10,000+
- **Reducción de código** (refactorización 2025): 38%

## 🎨 Características UX/UI

- **Design System** con tokens CSS
- **Animaciones suaves** y transiciones
- **Estados de carga** consistentes
- **Mensajes de feedback** claros
- **Accesibilidad** (ARIA labels, keyboard navigation)
- **Dark mode considerations**

## 🔧 Configuración y Deployment

El proyecto incluye:
- Configuración para Hostinger
- Variables de entorno para diferentes ambientes
- Scripts de rotación de logs
- Guías de deployment

## 📈 Proceso de Desarrollo

### Refactorización 2025
- Modularización de componentes complejos
- Reorganización de hooks por dominio
- Estandarización de código CSS
- Mejora de 38% en mantenibilidad

### Convenciones de Código
- ESLint para linting
- Formato CSS estandarizado
- Comentarios descriptivos
- Nomenclatura consistente

## 🎯 Casos de Uso

Este proyecto demuestra capacidad en:
- Desarrollo full-stack (React + PHP)
- Arquitectura de aplicaciones web
- Gestión de autenticación y autorización
- Optimización de rendimiento
- Seguridad web
- UX/UI responsive
- Mantenimiento de código legacy

## � Getting Started

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/ceramica-el-cinco.git

# Instalar dependencias
npm install

# Iniciar desarrollo
npm run dev

# Build de producción
npm run build
```

## 📝 Notas del Proyecto

- ✅ Proyecto real en producción
- ✅ Desarrollo iterativo con mejoras continuas
- ✅ Código refactorizado siguiendo mejores prácticas modernas
- ✅ Arquitectura escalable y mantenible
- ⚠️ Configuración de backend requiere setup adicional (ver documentación)

##  Información Adicional

**Desarrollado por**: [Tu Nombre]  
**Tipo**: Proyecto Freelance / Enterprise Application  
**Estado**: En Producción  
**Año**: 2024-2025

Para consultas sobre arquitectura, tecnologías utilizadas o decisiones de diseño, no dudes en contactar.

---

**Tecnologías**: React · PHP · MySQL · Vite · REST API · CSS3 · Git  
**Categorías**: Full-Stack · Web Development · Enterprise Application
