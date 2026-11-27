import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { money } from "../hooks.js";
import { ProductVisual } from "./ProductVisual.jsx";
import { productColor, productPath } from "../productOptions.js";
import { flyDeviceToCart } from "../cartFlight.js";

const DeviceViewer = lazy(() => import("./DeviceViewer.jsx"));
const showroomModels = new Set(["prism-x1", "prism-neo", "prism-ultra", "orbit-14", "echo-neon"]);

export function ProductCard({ product, onAdd }) {
  const [added, setAdded] = useState(false);
  const timer = useRef();
  const path = productPath(product);
  const visual = <ProductVisual image={product.image} productId={product.id} finish={product.colors?.[0]} className="product-render" />;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function addProduct(event) {
    onAdd(product);
    flyDeviceToCart(event.currentTarget, product.image, productColor(product)?.hex);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1300);
  }

  return (
    <article className="product-card">
      <Link className="product-art" to={path} aria-label={`Открыть ${product.title}`} viewTransition>
        {showroomModels.has(product.id) || product.image === "flash" ? (
          <Suspense fallback={visual}>
            <div className="card-model"><DeviceViewer product={product} interactive={false} /></div>
          </Suspense>
        ) : visual}
        <span className="product-arrow" aria-hidden="true">↗</span>
      </Link>
      <div className="product-info">
        <p className="eyebrow">{product.category}</p>
        <h3><Link to={path} viewTransition>{product.title}</Link></h3>
        <p className="product-description">{product.description}</p>
        {product.colors && (
          <div className="card-finishes" role="group" aria-label={`Цвета модели ${product.title}`}>
            {product.colors.map(color => (
              <Link key={color.id} className="finish-dot" style={{ "--finish": color.hex }}
                to={productPath(product, color)} title={color.name} aria-label={`Выбрать цвет: ${color.name}`} viewTransition />
            ))}
          </div>
        )}
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
