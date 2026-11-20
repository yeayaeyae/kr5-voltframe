const PRODUCTS_URL = `${import.meta.env.BASE_URL}products.json`;
export async function getProducts({ signal } = {}) { const response = await fetch(PRODUCTS_URL,{signal,headers:{Accept:'application/json'}}); if(!response.ok) throw new Error(`Не удалось загрузить каталог (${response.status}).`); const items=await response.json(); if(!Array.isArray(items)) throw new Error('Каталог имеет неверный формат.'); return items; }
export async function getProductById(id,options){const items=await getProducts(options);return items.find(p=>p.id===id)??null;}
