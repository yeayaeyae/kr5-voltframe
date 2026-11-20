import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { useCart, useProducts } from "../hooks.js";
import { edition } from "../editions.js";
import { ProductCard } from "../components/ProductCard.jsx";
import { ProductVisual } from "../components/ProductVisual.jsx";
import { Loading, LoadError } from "../components/States.jsx";

const DeviceViewer = lazy(() => import("../components/DeviceViewer.jsx"));

export function Home() {
  const { products, loading, error, reload } = useProducts();
  const { add } = useCart();
  const featured = { id: edition.featured, image: edition.model };

  return (
    <>
      <section className="edition-hero">
        <div className="container edition-hero-grid">
          <div className="edition-copy">
            <p className="edition-kicker">{edition.category}</p>
            <h1>{edition.title}</h1>
            <p className="edition-description">{edition.description}</p>
            <div className="edition-actions">
              <Link className="button" to="/catalog" viewTransition>Открыть каталог <span aria-hidden="true">↗</span></Link>
              <Link className="edition-text-link" to={`/catalog/${edition.featured}`} viewTransition>О {edition.product}</Link>
            </div>
          </div>
          <div className="edition-feature">
            <figure className="edition-figure">
              <Suspense fallback={<ProductVisual image={edition.model} className="featured-fallback" eager />}>
                <DeviceViewer product={featured} controls />
              </Suspense>
              <figcaption>{edition.product}</figcaption>
            </figure>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <h2>Новые модели</h2>
          <Link className="text-link" to="/catalog" viewTransition>Все товары ↗</Link>
        </div>
        {loading ? <Loading /> : error ? (
          <LoadError message={error} onRetry={() => reload()} />
        ) : (
          <div className="product-grid featured-grid">
            {products.slice(0, 3).map(product => (
              <ProductCard key={product.id} product={product} onAdd={({ id }) => add(id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
