import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeading } from "../components/PageHeading.jsx";
import { useCart } from "../hooks.js";
import { categories } from "../productOptions.js";

export function Order() {
  const [result, setResult] = useState(null);
  const { count } = useCart();

  function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const phone = form.elements.phone;
    const digits = phone.value.replace(/\D/g, "").length;
    const validPhone = /^[+\d()\s-]+$/.test(phone.value) && digits >= 10 && digits <= 15;
    phone.setCustomValidity(validPhone || !phone.value ? "" : "Введите телефон с 10–15 цифрами.");
    if (!form.reportValidity()) {
      setResult({ ok: false, text: "Проверьте выделенные поля." });
      return;
    }
    setResult({ ok: true, text: "Учебная заявка подготовлена. Данные остались в браузере." });
    form.reset();
  }

  return (
    <section className="section container page-section order-page">
      <PageHeading title="Оставить заявку" />
      <div className="checkout-grid">
        <form className="order-form" onSubmit={submit} noValidate>
          <label>Имя<input name="name" autoComplete="name" required minLength={2} placeholder="Как к вам обращаться" /></label>
          <label>Телефон<input name="phone" type="tel" autoComplete="tel" required placeholder="+7 900 000-00-00"
            onInput={event => event.currentTarget.setCustomValidity("")} /></label>
          <label>E-mail<input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label>
          <label>Категория
            <select name="product" defaultValue="">
              <option value="" disabled>Выберите категорию</option>
              {categories.map(category => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label className="form-wide">Комментарий<textarea name="comment" rows={4} placeholder="Модель, цвет или пожелания" /></label>
          <label className="consent form-wide"><input type="checkbox" required /> Согласен на обработку персональных данных</label>
          <button className="button form-wide" type="submit">Подготовить заявку <span aria-hidden="true">↗</span></button>
          {result && (
            <p className={`form-result form-wide ${result.ok ? "success" : "failure"}`} role="status">
              {result.text}
            </p>
          )}
        </form>
        <aside className="checkout-summary order-note">
          <h2>{count ? `В корзине: ${count} шт.` : "Учебная заявка"}</h2>
          <p>Форма подготовит заявку в браузере. Оплата и отправка данных не предусмотрены.</p>
          <Link className="text-link" to={count ? "/cart" : "/catalog"} viewTransition>
            {count ? "Вернуться в корзину" : "Посмотреть каталог"} ↗
          </Link>
        </aside>
      </div>
    </section>
  );
}
