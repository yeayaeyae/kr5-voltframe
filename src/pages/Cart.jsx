import { Link } from "react-router-dom";
import { money, useCart, useProducts } from "../hooks.js";
import { PageHeading } from "../components/PageHeading.jsx";
import { ProductVisual } from "../components/ProductVisual.jsx";
import { Loading, LoadError } from "../components/States.jsx";
import { productColor, productPath } from "../productOptions.js";

export function Cart() {
  const { products, loading, error, reload } = useProducts();
  const { cart, change, remove } = useCart();
  const byId = new Map(products.map(product => [product.id, product]));
  const items = Object.entries(cart).flatMap(([sku, quantity]) => {
    const [id, colorId] = sku.split(":");
    const product = byId.get(id);
    return product ? [{ sku, product, quantity, color: productColor(product, colorId) }] : [];
  });
  const total = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0);

  return (
    <section className="section container page-section cart-page">
      <PageHeading title="Корзина" />
      {loading ? <Loading /> : error ? (
        <LoadError message={error} onRetry={() => reload()} />
      ) : items.length ? (
        <div className="checkout-grid">
          <div className="cart-list">
            {items.map(({ sku, product, quantity, color }) => (
              <article className="cart-item" key={sku}>
                <Link className="cart-art" to={productPath(product, color)} aria-label={`Открыть ${product.title}`} viewTransition>
                  <ProductVisual image={product.image} productId={product.id} finish={color} />
                </Link>
                <div className="cart-title">
                  <p className="eyebrow">{product.category}</p>
                  <h2><Link to={productPath(product, color)} viewTransition>{product.title}</Link></h2>
                  {color && <p className="cart-finish"><span className="finish-dot" style={{ "--finish": color.hex }} />{color.name}</p>}
                  <p>{money(product.price)} / шт.</p>
                </div>
                <div className="quantity">
                  <button type="button" aria-label={`Уменьшить количество: ${product.title}${color ? `, ${color.name}` : ""}`} onClick={() => change(sku, -1)}>−</button>
                  <span>{quantity}</span>
                  <button type="button" aria-label={`Увеличить количество: ${product.title}${color ? `, ${color.name}` : ""}`} onClick={() => change(sku, 1)}>+</button>
                </div>
                <strong className="cart-item-total">{money(product.price * quantity)}</strong>
                <button type="button" className="remove-button" onClick={() => remove(sku)}>Убрать</button>
              </article>
            ))}
          </div>
          <aside className="checkout-summary">
            <h2>Итого</h2>
            <strong aria-live="polite">{money(total)}</strong>
            <Link viewTransition className="button" to="/order">Оформить заявку <span aria-hidden="true">↗</span></Link>
          </aside>
        </div>
      ) : (
        <div className="state-card empty-cart">
          <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
            <path d="M10 17h28l3 24H7l3-24Zm8 2v-7a6 6 0 1 1 12 0v7" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
          </svg>
          <h2>Корзина пока пуста</h2>
          <p>Добавьте устройство, чтобы оформить заявку.</p>
          <Link viewTransition className="button" to="/catalog">Перейти в каталог <span aria-hidden="true">↗</span></Link>
        </div>
      )}
    </section>
  );
}
