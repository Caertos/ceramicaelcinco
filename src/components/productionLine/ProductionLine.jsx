import { memo, useState, useEffect, useCallback } from "react";
import "./productionLine.css";

function ProductionLine({ onPdfSelect, selectedPdf }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [currentViewUrl, setCurrentViewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/get_catalogos.php");
        if (!res.ok) throw new Error("Fallo al obtener catálogos");
        const data = await res.json();
        if (!mounted) return;
        setCategories(data || []);
        if (data && data.length > 0) {
          const firstCat = data[0];
          setSelectedCategoryId(firstCat.id);
          const firstItem = firstCat.items?.[0];
          const initialView = firstItem ? firstItem.viewUrl : "";
          setCurrentViewUrl(initialView);
          if (typeof onPdfSelect === "function" && initialView) {
            onPdfSelect(initialView);
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || "Error al cargar datos");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (selectedPdf && selectedPdf !== currentViewUrl) {
      setCurrentViewUrl(selectedPdf);
    }
  }, [selectedPdf]);

  const categoryItems =
    categories.find((c) => c.id === selectedCategoryId)?.items || [];

  const handleSelectCategory = useCallback(
    (cat) => {
      console.debug("handleSelectCategory", cat?.id);
      setSelectedCategoryId(cat.id);
      const first = cat.items?.[0];
      const url = first ? first.viewUrl : "";
      setCurrentViewUrl(url);
      if (typeof onPdfSelect === "function" && url && url !== currentViewUrl) {
        onPdfSelect(url);
      }
    },
    [onPdfSelect, currentViewUrl]
  );

  const handleSelectProduct = useCallback(
    (p) => {
      console.debug("handleSelectProduct", p?.id, p?.viewUrl);
      if (p.viewUrl === currentViewUrl) {
        // forzar recarga dentro del iframe (hack ligero)
        setCurrentViewUrl("");
        setTimeout(() => setCurrentViewUrl(p.viewUrl), 50);
      } else {
        setCurrentViewUrl(p.viewUrl);
      }
      if (typeof onPdfSelect === "function" && p.viewUrl !== currentViewUrl) {
        onPdfSelect(p.viewUrl);
        console.log("Selected PDF URL:", p.viewUrl);
      }
    },
    [onPdfSelect, currentViewUrl]
  );

  return (
    <section className="production-container">
      <div className="categories-container">
        {loading ? (
          <p>Cargando categorías...</p>
        ) : error ? (
          <p className="error">Error: {error}</p>
        ) : categories.length === 0 ? (
          <p>No hay categorías.</p>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={cat.id === selectedCategoryId ? "active-category" : ""}
              onClick={(e) => {
                // prevenimos cualquier comportamiento por defecto/navegación
                if (e && typeof e.preventDefault === "function")
                  e.preventDefault();
                if (e && typeof e.stopPropagation === "function")
                  e.stopPropagation();
                handleSelectCategory(cat);
              }}
            >
              {cat.name}
            </button>
          ))
        )}
      </div>

      <div className="products-section">
        <div className="selection-container">
          {loading ? (
            <p>Cargando productos...</p>
          ) : categoryItems.length === 0 ? (
            <p>No hay productos en esta categoría.</p>
          ) : (
            categoryItems.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={(e) => {
                  if (e && typeof e.preventDefault === "function")
                    e.preventDefault();
                  if (e && typeof e.stopPropagation === "function")
                    e.stopPropagation();
                  handleSelectProduct(p);
                }}
              >
                {p.label}
              </button>
            ))
          )}
        </div>

        <div className="pdf-viewer-container">
          {currentViewUrl ? (
            <iframe
              title="PDF Viewer"
              src={`${currentViewUrl}#navpanes=0`}
              style={{ border: 0 }}
            />
          ) : (
            <p>No se encontró un PDF seleccionado.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export default memo(ProductionLine);
