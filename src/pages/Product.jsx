import { lazy, Suspense } from "react";
import { Link, useParams } from "react-router-dom";
import { money, useCart, useProducts } from "../hooks.js";
import { ProductVisual } from "../components/ProductVisual.jsx";
import { Loading, LoadError } from "../components/States.jsx";

const DeviceViewer = lazy(() => import("../components/DeviceViewer.jsx"));

export function Product() {
  const { productId } = useParams();
  const { products, loading, error, reload } = useProducts();
  const { add, cart } = useCart();
  const product = products.find(item => item.id === productId);
  let content;

  if (loading) {
    content = <Loading />;
  } else if (error) {
    content = <LoadError message={error} onRetry={() => reload()} />;
  } else if (!product) {
    content = (
      <div className="state-card">
        <h1>Такого устройства нет в каталоге</h1>
        <Link className="button" to="/catalog" viewTransition>Вернуться в каталог</Link>
      </div>
    );
  } else {
    content = (
      <>
        <Link className="back-link" to="/catalog" viewTransition>← Все устройства</Link>
        <div className="detail-layout">
          <div className="product-model">
            <Suspense fallback={<ProductVisual image={product.image} className="featured-fallback" eager />}>
              <DeviceViewer key={product.id} product={product} controls />
            </Suspense>
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <p className="detail-description">{product.description}</p>
            <p className="detail-price">{money(product.price)}</p>
            <p className={product.isAvailable ? "stock" : "stock out-of-stock"}>
              {product.isAvailable ? "● В наличии" : "● Временно нет в наличии"}
            </p>
            <button className="button" type="button" disabled={!product.isAvailable} onClick={() => add(product.id)}>
              {product.isAvailable ? "Добавить в корзину" : "Нет в наличии"}
            </button>
            <span className="visually-hidden" role="status">
              {cart[product.id] ? `В корзине: ${cart[product.id]} шт.` : ""}
            </span>
            <h2 className="spec-title">Характеристики</h2>
            <dl className="spec-list">
              {product.features.map(({ label, value }) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
            <Link className="text-link" to="/order" viewTransition>Оставить заявку ↗</Link>
          </div>
        </div>
      </>
    );
  }

  return <section className="section container page-section">{content}</section>;
}
