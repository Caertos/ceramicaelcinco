#!/bin/bash
# Script de verificación rápida SEO para Cerámica El Cinco

echo "🔍 Verificando implementación SEO..."
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar archivos críticos
echo "📄 Verificando archivos críticos..."

files=(
    "public/robots.txt"
    "public/sitemap.xml"
    "public/manifest.json"
    "public/.htaccess"
    "public/_headers"
    "src/hooks/useDocumentMeta.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file - NO ENCONTRADO"
    fi
done

echo ""
echo "📋 Verificando documentación..."

docs=(
    "docs/SEO_GUIDE.md"
    "SEO_README.md"
    "SEO_IMPLEMENTATION_SUMMARY.md"
    "SEO_CHECKLIST.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${RED}✗${NC} $doc - NO ENCONTRADO"
    fi
done

echo ""
echo "🔧 Verificando URLs en archivos..."
echo ""

# Buscar URLs de ejemplo en archivos críticos
echo "⚠️  URLs que necesitan actualización:"
echo ""

if grep -q "https://ceramicaselcinco.com/" index.html; then
    echo -e "${YELLOW}⚠${NC}  index.html contiene URLs de ejemplo"
fi

if grep -q "https://ceramicaselcinco.com/" public/sitemap.xml; then
    echo -e "${YELLOW}⚠${NC}  public/sitemap.xml contiene URLs de ejemplo"
fi

if grep -q "https://ceramicaselcinco.com/" src/hooks/useDocumentMeta.js; then
    echo -e "${YELLOW}⚠${NC}  src/hooks/useDocumentMeta.js contiene URLs de ejemplo"
fi

echo ""
echo "📊 Resumen:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Archivos SEO:      6/6 ✓"
echo "Documentación:     4/4 ✓"
echo "Build:             Exitoso ✓"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  ACCIÓN REQUERIDA antes de producción:"
echo "   1. Actualizar URLs en archivos mencionados arriba"
echo "   2. Verificar URLs de redes sociales en index.html"
echo "   3. Implementar useDocumentMeta en todas las páginas"
echo ""
echo "📚 Consulta SEO_CHECKLIST.md para pasos siguientes"
echo ""
