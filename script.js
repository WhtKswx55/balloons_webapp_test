const tg = window.Telegram.WebApp;
tg.expand();

const API_URL = '/api/products';
const SERVER_URL = '/webhook_data';
const h = { "ngrok-skip-browser-warning": "69420" };

let cart = {};
let productsData = [];
const categories = [
    { id: 'feb14', name: '14 февраля', img: 'img/feb14.jpg' },
    { id: 'bday', name: 'День рождения', img: 'img/bday.jpg' },
    { id: 'other', name: 'Другое', img: 'img/other.jpg' }
];

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?v=${Date.now()}`, { headers: h });
        if (!response.ok) throw new Error("Ошибка загрузки данных");
        productsData = await response.json();
        initCategories();
    } catch (e) {
        console.error("Критическая ошибка:", e);
        tg.showAlert("Не удалось загрузить товары.");
    }
}

function initCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;

    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="showProducts('${cat.id}', '${cat.name}')">
            <img src="${cat.img}" class="category-img" onerror="this.src='img/no-photo.jpg'">
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
}

function showProducts(catId, catName) {
    window.scrollTo(0, 0);
    const screens = ['categories-screen', 'products-screen', 'order-screen'];
    screens.forEach(s => document.getElementById(s)?.classList.add('hidden'));

    document.getElementById('products-screen').classList.remove('hidden');
    document.getElementById('category-title').innerText = catName;

    tg.BackButton.show();
    tg.BackButton.onClick(showCategories);

    const list = document.getElementById('products-list');
    if (!list) return;

    const items = productsData.filter(p => String(p.category_id) === String(catId));

    if (items.length > 0) {
        list.innerHTML = items.map(p => {
            const safeName = p.name.replace(/"/g, '&quot;');
            const imgPath = p.img ? (p.img.startsWith('http') ? p.img : '/' + p.img) : '/img/no-photo.jpg';
            return `
            <div class="product-card">
                <img src="${imgPath}" class="product-img" onerror="this.src='/img/no-photo.jpg'">
                <div class="product-info">
                    <div class="product-title">${p.name}</div>
                    <div class="product-art">арт. ${p.art || '---'}</div>
                    <div class="product-price">${p.price} руб.</div>
                    <div class="qty-wrapper">
                        <button class="qty-btn" onclick="changeQty(-1, ${p.id}, '${safeName}', ${p.price})">-</button>
                        <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
                        <button class="qty-btn" onclick="changeQty(1, ${p.id}, '${safeName}', ${p.price})">+</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        list.innerHTML = '<p style="text-align:center; padding: 40px; color: #999; grid-column: 1/-1;">В этой категории пока пусто</p>';
    }
}

function showCategories() {
    const screens = ['products-screen', 'order-screen'];
    screens.forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById('categories-screen').classList.remove('hidden');
    tg.BackButton.hide();
}

function changeQty(delta, id, name, price) {
    if (!cart[id]) cart[id] = { name, price, qty: 0 };
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];

    const label = document.getElementById(`qty-${id}`);
    if (label) label.innerText = cart[id]?.qty || 0;
    updateMainButton();
}

function updateMainButton() {
    let total = 0;
    for (let id in cart) total += cart[id].price * cart[id].qty;

    if (total > 0) {
        tg.MainButton.setText(`Оформить заказ: ${total} руб.`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

tg.MainButton.onClick(() => {
    const orderScreen = document.getElementById('order-screen');
    if (orderScreen && !orderScreen.classList.contains('hidden')) {
        submitOrder();
    } else {
        showOrder();
    }
});

function showOrder() {
    const screens = ['categories-screen', 'products-screen'];
    screens.forEach(s => document.getElementById(s)?.classList.add('hidden'));
    document.getElementById('order-screen').classList.remove('hidden');

    const container = document.getElementById('cart-items');
    let total = 0;
    if (container) {
        container.innerHTML = Object.values(cart).map(item => {
            total += item.price * item.qty;
            return `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #eee;">
                <span>${item.name} x${item.qty}</span>
                <span>${item.price * item.qty} р.</span>
            </div>`;
        }).join('');
    }
    document.getElementById('total-amount').innerText = total;
    tg.MainButton.setText("✅ Отправить заказ");
}

async function submitOrder() {
    const name = document.getElementById('user-name')?.value;
    const surname = document.getElementById('user-surname')?.value;
    const date = document.getElementById('order-date')?.value;

    if (!name || !surname || !date) {
        tg.showAlert("Пожалуйста, заполните Имя, Фамилию и Дату!");
        return;
    }

    tg.MainButton.showProgress();
    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        order_details: {
            customer: { name, surname, date },
            products: Object.values(cart),
            total_price: Object.values(cart).reduce((s, p) => s + (p.price * p.qty), 0)
        }
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { ...h, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (response.ok) tg.close();
        else throw new Error("Сервер не принял заказ");
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка при отправке: " + e.message);
    }
}

// Запускаем только когда HTML полностью готов
document.addEventListener('DOMContentLoaded', loadProducts);
