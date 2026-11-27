import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCart, useProducts } from "../hooks.js";
import { PageHeading } from "../components/PageHeading.jsx";
import { ProductCard } from "../components/ProductCard.jsx";
import { LoadError, Loading } from "../components/States.jsx";
import { categories } from "../productOptions.js";

const allCategories = "Все устройства";
const plural = new Intl.PluralRules("ru");
const countLabels = { one: "устройство", few: "устройства", many: "устройств", other: "устройства" };

export function Catalog() {
  const { products, loading, error, reload } = useProducts();
  const { add } = useCart();
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const currentCategory = params.get("category");
  const category = categories.includes(currentCategory) ? currentCategory : allCategories;
  const [sort, setSort] = useState("featured");
  function setCategory(nextCategory) {
    setParams(previous => {
      const next = new URLSearchParams(previous);
      if (nextCategory === allCategories) next.delete("category");
      else next.set("category", nextCategory);
      return next;
    }, { replace: true, preventScrollReset: true });
  }
  const results = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("ru");
    const items = products.filter(item => item.title.toLocaleLowerCase("ru").includes(search)
      && (category === allCategories || item.category === category));
    if (sort === "low") items.sort((a, b) => a.price - b.price);
    if (sort === "high") items.sort((a, b) => b.price - a.price);
    if (sort === "title") items.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    return items;
  }, [products, query, category, sort]);

  return (
    <section className="section container page-section catalog-page">
      <PageHeading title="Каталог" description="Выберите категорию или модель, чтобы рассмотреть устройство в 3D.">
        <span className="catalog-count" role="status">
          {loading || error ? "" : `${results.length} ${countLabels[plural.select(results.length)]}`}
        </span>
      </PageHeading>
      <div className="catalog-console">
        <div className="catalog-chips" role="group" aria-label="Категории">
          {[allCategories, ...categories].map(item => (
            <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
        <label className="catalog-search">
          <span className="visually-hidden">Поиск по названию</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
            <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)}
            placeholder="Поиск по модели" />
        </label>
        <label className="catalog-sort">
          <span className="visually-hidden">Сортировка</span>
          <select value={sort} onChange={event => setSort(event.target.value)}>
            <option value="featured">Рекомендуемые</option>
            <option value="low">Сначала дешевле</option>
            <option value="high">Сначала дороже</option>
            <option value="title">По названию</option>
          </select>
        </label>
      </div>
      {loading ? <Loading /> : error ? (
        <LoadError message={error} onRetry={() => reload()} />
      ) : results.length ? (
        <div className="product-grid">
          {results.map(product => (
            <ProductCard key={product.id} product={product} onAdd={({ id }) => add(id)} />
          ))}
        </div>
      ) : (
        <div className="state-card">
          <h2>Ничего не нашлось</h2>
          <p>Попробуйте изменить запрос или категорию.</p>
          <button className="button button-outline" onClick={() => { setQuery(""); setCategory(allCategories); setSort("featured"); }}>
            Сбросить фильтры
          </button>
        </div>
      )}
    </section>
  );
}
