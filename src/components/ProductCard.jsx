import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../hooks.js";
import { ProductVisual } from "./ProductVisual.jsx";

const DeviceViewer = lazy(() => import("./DeviceViewer.jsx"));
const showroomModels = new Set(["prism-x1", "orbit-14", "echo-neon"]);

export function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const timer = useRef();
  const productPath = `/catalog/${product.id}`;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function addProduct() {
    onAdd(product);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <article className="product-card">
      <Link className="product-art" to={productPath} aria-label={`Открыть ${product.title}`} viewTransition>
        {showroomModels.has(product.id) ? (
          <Suspense fallback={<ProductVisual image={product.image} className="product-render" />}>
            <div className="card-model"><DeviceViewer product={product} interactive={false} /></div>
          </Suspense>
        ) : <ProductVisual image={product.image} className="product-render" />}
        <span className="product-arrow" aria-hidden="true">↗</span>
      </Link>
      <div className="product-info">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={productPath} viewTransition>{product.title}</Link></h3>
        <p className="product-description">{product.description}</p>
        <div className="product-bottom">
          <strong>{money(product.price)}</strong>
          <button
            className={added ? "button button-small is-added" : "button button-small"}
            type="button"
            onClick={addProduct}
            disabled={!product.isAvailable}
          >
            {product.isAvailable ? (added ? "Добавлено" : "В корзину") : "Нет в наличии"}
          </button>
        </div>
        <span className="visually-hidden" role="status">{added ? `${product.title} добавлен в корзину` : ""}</span>
      </div>
    </article>
  );
}
