#!/usr/bin/env node
import { mdToPdf } from 'md-to-pdf';
import { mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, extname } from 'node:path';

/**
 * Script Universal de Exportación MD → PDF
 * ========================================
 * 
 * Busca automáticamente todos los archivos .md en el proyecto y los convierte a PDF.
 * Es completamente dinámico y reutilizable para cualquier proyecto.
 * 
 * Uso:
 *   node scripts/exportMD-PDF.js                    # Exporta docs/ y README.md a manuals/
 *   node scripts/exportMD-PDF.js --out=output      # Especifica directorio de salida
 *   node scripts/exportMD-PDF.js --source=custom   # Especifica directorio fuente adicional
 *   node scripts/exportMD-PDF.js --help            # Muestra esta ayuda
 *   
 * Variables de entorno:
 *   MANUALS_OUT_DIR=directorio    # Directorio de salida por defecto
 *   DOCS_SOURCE_DIR=directorio    # Directorio fuente adicional
 *   
 * Características:
 *   • Búsqueda automática y recursiva de archivos .md
 *   • Soporte para múltiples directorios fuente
 *   • Configuración flexible por argumentos o variables de entorno
 *   • Manejo de errores con resumen final
 *   • CSS optimizado para documentación técnica
 */

// Función de ayuda
function showHelp() {
  console.log(`
📄 Script Universal de Exportación MD → PDF
==========================================

DESCRIPCIÓN:
  Busca automáticamente todos los archivos .md en el proyecto y los 
  convierte a PDF con formato profesional.

USO:
  node scripts/exportMD-PDF.js [opciones]

OPCIONES:
  --out=DIRECTORIO     Directorio de salida (por defecto: 'manuals')
  --source=DIRECTORIO  Directorio fuente adicional (además de 'docs')
  --help              Muestra esta ayuda

VARIABLES DE ENTORNO:
  MANUALS_OUT_DIR     Directorio de salida por defecto
  DOCS_SOURCE_DIR     Directorio fuente adicional

EJEMPLOS:
  node scripts/exportMD-PDF.js
  node scripts/exportMD-PDF.js --out=documentation
  node scripts/exportMD-PDF.js --source=extra-docs --out=all-pdfs

ARCHIVOS PROCESADOS:
  • README.md (si existe en la raíz)
  • Todos los .md en docs/ (recursivamente)
  • Archivos en directorio --source si se especifica

FORMATO PDF:
  • Fuente: System UI optimizada para legibilidad
  • Tamaño: A4 con márgenes profesionales
  • Estilo: Tablas, código y citas formateados
`);
}

// Verificar si se solicita ayuda
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Configuración de directorios
const outArg = process.argv.find(a => a.startsWith('--out='));
const sourceArg = process.argv.find(a => a.startsWith('--source='));

const outBase = outArg ? outArg.split('=')[1] : (process.env.MANUALS_OUT_DIR || 'manuals');
const customSource = sourceArg ? sourceArg.split('=')[1] : process.env.DOCS_SOURCE_DIR;

const outDir = resolve(outBase);

// Crear directorio de salida si no existe
if (!existsSync(outDir)) {
  mkdirSync(outDir, { recursive: true });
}

/**
 * Encuentra recursivamente todos los archivos .md en un directorio
 * @param {string} dir - Directorio a escanear
 * @param {string[]} files - Array acumulador de archivos
 * @returns {string[]} Array de rutas de archivos .md
 */
function findMarkdownFiles(dir, files = []) {
  if (!existsSync(dir)) return files;
  
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Recursión en subdirectorios
      findMarkdownFiles(fullPath, files);
    } else if (stat.isFile() && extname(item).toLowerCase() === '.md') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Buscar archivos .md
let markdownFiles = [];

// 1. README.md en la raíz del proyecto
const readmePath = resolve('README.md');
if (existsSync(readmePath)) {
  markdownFiles.push(readmePath);
}

// 2. Todos los .md en docs/
const docsDir = resolve('docs');
markdownFiles = markdownFiles.concat(findMarkdownFiles(docsDir));

// 3. Directorio fuente personalizado si se especifica
if (customSource) {
  const customDir = resolve(customSource);
  markdownFiles = markdownFiles.concat(findMarkdownFiles(customDir));
}

// Eliminar duplicados y ordenar
markdownFiles = [...new Set(markdownFiles)].sort();

console.log(`📄 Encontrados ${markdownFiles.length} archivos .md para procesar:`);
markdownFiles.forEach(file => {
  const relativePath = file.replace(process.cwd() + '/', '');
  console.log(`   • ${relativePath}`);
});
console.log('');

const css = `:root { --font-body: system-ui, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
body { font-family: var(--font-body); line-height: 1.4; font-size: 13px; }
h1, h2, h3 { font-weight: 600; }
code { background:#f5f5f5; padding:2px 4px; border-radius:4px; }
table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
th, td { border: 1px solid #ccc; padding: 4px 6px; font-size: 12px; }
th { background:#f0f0f0; }
blockquote { border-left: 4px solid #999; padding: 4px 8px; color:#444; background:#fafafa; }
hr { border: none; border-top:1px solid #ddd; margin:2.2rem 0; }
@page { margin: 24mm 16mm 24mm 16mm; }
`; // sencillo y portable

// Procesar archivos
(async () => {
  if (markdownFiles.length === 0) {
    console.log('⚠️  No se encontraron archivos .md para procesar');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const markdownFile of markdownFiles) {
    try {
      // Generar nombre del PDF basado en el nombre del archivo
      const fileName = markdownFile.split('/').pop().replace(/\.md$/i, '');
      const pdfPath = resolve(outDir, `${fileName}.pdf`);
      
      // Convertir MD a PDF
      await mdToPdf({ path: markdownFile }, { 
        dest: pdfPath, 
        css, 
        pdf_options: { format: 'A4' } 
      });
      
      console.log(`✔ Exportado: ${fileName}.pdf`);
      successCount++;
      
    } catch (error) {
      const relativePath = markdownFile.replace(process.cwd() + '/', '');
      console.error(`✖ Error exportando ${relativePath}:`, error.message);
      errorCount++;
      process.exitCode = 1;
    }
  }

  // Resumen final
  console.log('');
  console.log(`📊 Resumen de procesamiento:`);
  console.log(`   ✔ Exitosos: ${successCount}`);
  if (errorCount > 0) {
    console.log(`   ✖ Errores: ${errorCount}`);
  }
  console.log(`   📁 Directorio de salida: ${outDir}`);
})();
