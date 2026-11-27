import { useLayoutEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useCart } from "../hooks.js";
import { editions, editionId, siteBase } from "../editions.js";

export function Layout() {
  const [open, setOpen] = useState(false);
  const { pathname, search } = useLocation();
  const { count } = useCart();
  const closeMenu = () => setOpen(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <a className="skip-link" href="#main">Перейти к содержимому</a>
      <header className="site-header">
        <div className="container header-inner">
          <Link to="/" className="brand" onClick={closeMenu} viewTransition>
            VOLT<span>FRAME</span>
          </Link>
          <NavLink className="mobile-cart-link" to="/cart" aria-label={`Корзина, ${count}`}
            onClick={closeMenu} viewTransition>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 8h14l1.7 12H3.3L5 8Zm4 0V6a3 3 0 1 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
            <span className="cart-count" key={count} data-cart-flight-target>{count}</span>
          </NavLink>
          <button
            className="menu-toggle"
            type="button"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen(value => !value)}
          >
            {open ? "Закрыть" : "Меню"}
          </button>
          <nav id="site-nav" className={open ? "site-nav is-open" : "site-nav"} aria-label="Основная навигация">
            <NavLink to="/" end onClick={closeMenu} viewTransition>Главная</NavLink>
            <NavLink to="/catalog" onClick={closeMenu} viewTransition>Каталог</NavLink>
            <NavLink to="/order" onClick={closeMenu} viewTransition>Заявка</NavLink>
            <NavLink className="desktop-cart-link" to="/cart" onClick={closeMenu} viewTransition>
              Корзина <span className="cart-count" key={count} data-cart-flight-target>{count}</span>
            </NavLink>
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="route-content" key={pathname}>
          <Outlet />
        </div>
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <Link to="/" className="brand brand-footer" viewTransition>VOLT<span>FRAME</span></Link>
          <nav className="edition-switch" aria-label="Версии дизайна">
            {Object.entries(editions).map(([id, { name }]) => (
              <a key={id} href={`${siteBase}${id}${pathname}${search}`} aria-current={id === editionId ? "true" : undefined}>
                {name}
              </a>
            ))}
          </nav>
          <span>© 2026 VOLTFRAME</span>
        </div>
      </footer>
    </>
  );
}
