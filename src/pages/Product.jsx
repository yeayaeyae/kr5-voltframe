import { lazy, Suspense, useRef } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { money, useCart, useProducts } from "../hooks.js";
import { ProductVisual } from "../components/ProductVisual.jsx";
import DeviceTeardown from "../components/DeviceTeardown.jsx";
import { teardownParts } from "../components/teardownParts.js";
import { Loading, LoadError } from "../components/States.jsx";
import { cartSku, productColor } from "../productOptions.js";
import { flyDeviceToCart } from "../cartFlight.js";

const DeviceViewer = lazy(() => import("../components/DeviceViewer.jsx"));

export function Product() {
  const { productId } = useParams();
  const [params, setParams] = useSearchParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const exteriorButton = useRef(null);
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
    const color = productColor(product, params.get("color"));
    const sku = cartSku(product, color);
    const hasTeardown = Object.hasOwn(teardownParts, product.image);
    const closeup = hasTeardown && params.get("view") === "exploded";
    function setCloseup(enabled) {
      if (enabled === closeup) return;
      const next = new URLSearchParams(params);
      if (enabled) {
        const exteriorSearch = next.toString();
        next.set("view", "exploded");
        setParams(next, { state: { exteriorSearch }, preventScrollReset: true });
        return;
      }
      exteriorButton.current?.focus({ preventScroll: true });
      next.delete("view");
      if (state?.exteriorSearch === next.toString()) navigate(-1);
      else setParams(next, { replace: true, preventScrollReset: true });
    }
    content = (
      <>
        <nav className="product-breadcrumb" aria-label="Путь к товару">
          <Link className="back-link" to="/catalog" viewTransition>← Каталог</Link>
          <span>{product.category}</span>
        </nav>
        <div className="detail-layout">
          <div className="product-model">
            {hasTeardown && (
              <div className="product-view-switch teardown-modes" role="group" aria-label="Просмотр устройства">
                <button type="button" ref={exteriorButton} aria-pressed={!closeup} onClick={() => setCloseup(false)}>Внешний вид</button>
                <button type="button" aria-pressed={closeup} onClick={() => setCloseup(true)}>Крупный план</button>
              </div>
            )}
            {closeup ? <DeviceTeardown key={product.id} product={product} finish={color} onBack={() => setCloseup(false)} /> : (
              <>
                {!hasTeardown && <span className="model-tag"><span aria-hidden="true" /> 3D-просмотр</span>}
                <Suspense fallback={<ProductVisual image={product.image} productId={product.id} finish={color} className="featured-fallback" eager />}>
                  <DeviceViewer key={product.id} product={product} finish={color} controls />
                </Suspense>
              </>
            )}
          </div>
          <div className="detail-copy">
            <p className="eyebrow">{product.category}</p>
            <h1>{product.title}</h1>
            <p className="detail-description">{product.description}</p>
            {color && (
              <fieldset className="finish-picker">
                <legend>Цвет корпуса <strong>{color.name}</strong></legend>
                <div className="finish-options">
                  {product.colors.map(option => (
                    <label key={option.id} className="finish-option">
                      <input type="radio" name="finish" value={option.id} checked={option.id === color.id}
                        onChange={() => setParams(previous => {
                          const next = new URLSearchParams(previous);
                          if (option.id === product.colors[0].id) next.delete("color");
                          else next.set("color", option.id);
                          return next;
                        }, { replace: true, preventScrollReset: true })} />
                      <span className="finish-dot" style={{ "--finish": option.hex }} />
                      <span>{option.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            <div className="detail-buy">
              <div>
                <p className="detail-price">{money(product.price)}</p>
                <p className={product.isAvailable ? "stock" : "stock out-of-stock"}>
                  {product.isAvailable ? "● В наличии" : "● Временно нет в наличии"}
                </p>
              </div>
              <button className="button" type="button" disabled={!product.isAvailable} onClick={event => {
                add(sku);
                flyDeviceToCart(event.currentTarget, product.image, color?.hex);
              }}>
                {product.isAvailable ? (cart[sku] ? `В корзине: ${cart[sku]} шт. · +` : "В корзину") : "Нет в наличии"}
              </button>
            </div>
            <span className="visually-hidden" role="status">
              {cart[sku] ? `${color?.name ?? product.title}: в корзине ${cart[sku]} шт.` : ""}
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

  return <section className="section container page-section product-page">{content}</section>;
}
