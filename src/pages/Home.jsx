import { Link } from "react-router-dom";
import { useCart, useProducts } from "../hooks.js";
import { CinematicShowcase } from "../components/CinematicShowcase.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { Loading, LoadError } from "../components/States.jsx";

export function Home() {
  const { products, loading, error, reload } = useProducts();
  const { add } = useCart();

  return (
    <>
      <CinematicShowcase products={products} />
      <section className="section container">
        <div className="section-heading">
          <h2>Новые модели</h2>
          <Link className="text-link" to="/catalog" viewTransition>Все товары ↗</Link>
        </div>
        {loading ? <Loading /> : error ? (
          <LoadError message={error} onRetry={() => reload()} />
        ) : (
          <div className="product-grid featured-grid">
            {products.slice(-3).reverse().map(product => (
              <ProductCard key={product.id} product={product} onAdd={({ id }) => add(id)} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
