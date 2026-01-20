const tg = window.Telegram.WebApp;
tg.expand();

try {
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
} catch(e) {}

const SERVER_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data';

const categories = [
    { id: 'feb14', name: '14 февраля', img: '' },
    { id: 'march8', name: '8 марта', img: '' },
    { id: 'march23', name: '23 февраля', img: '' },
    { id: 'school', name: 'Школьные шарики', img: '' },
    { id: 'gender', name: 'Гендерные шарики', img: '' },
    { id: 'bday', name: 'День рождения', img: 'img/bday1.jpg
    { id: 'baby', name: 'На выписку', img: '' },
    { id: 'decor', name: 'Оформление', img: '' }
];

const products = {
    'feb14': [
        { id: 1, name: 'Сет "Сердца"', price: 1500, img: '' },
        { id: 2, name: 'Фольгированный шар', price: 400, img: '' }
    ],
    'bday': [
        { id: 10, name: 'Цифра золотая', price: 800, img: 'https://images.unsplash.com/photo-1530103043960-ef38714abb15?w=300' }
    ]
};

let cart = {};

function initCategories() {
    const list = document.getElementById('categories-list');
    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="showProducts('${cat.id}', '${cat.name}')">
            <img src="${cat.img}" class="category-img">
            <span class="category-name">${cat.name}</span>
        </div>
    `).join('');
}

function showProducts(catId, catName) {
    window.scrollTo(0,0);
    document.getElementById('categories-screen').classList.add('hidden');
    document.getElementById('products-screen').classList.remove('hidden');
    document.getElementById('category-title').innerText = catName;

    const list = document.getElementById('products-list');
    const items = products[catId] || [];

    list.innerHTML = items.length ? items.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img">
            <div style="padding: 10px;">
                <div class="product-title">${p.name}</div>
                <div class="product-price">${p.price} руб.</div>
                <div class="qty-wrapper">
                    <button class="qty-btn" onclick="changeQty(-1, ${p.id}, '${p.name}', ${p.price})">-</button>
                    <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
                    <button class="qty-btn" onclick="changeQty(1, ${p.id}, '${p.name}', ${p.price})">+</button>
                </div>
            </div>
        </div>
    `).join('') : '<p style="grid-column: 1/3; text-align:center; padding: 20px;">Скоро добавим товары!</p>';
}

function showCategories() {
    document.getElementById('categories-screen').classList.remove('hidden');
    document.getElementById('products-screen').classList.add('hidden');
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
        tg.MainButton.setText(`В корзину: ${total} руб.`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

tg.MainButton.onClick(() => {
    if (!document.getElementById('order-screen').classList.contains('hidden')) {
        submitOrder();
    } else {
        showOrder();
    }
});

function showOrder() {
    document.getElementById('app').childNodes.forEach(n => n.nodeType === 1 && n.classList.add('hidden'));
    document.getElementById('order-screen').classList.remove('hidden');

    const container = document.getElementById('cart-items');
    let total = 0;
    container.innerHTML = Object.values(cart).map(item => {
        total += item.price * item.qty;
        return `<div class="cart-row" style="padding:10px 15px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;">
            <span>${item.name} x${item.qty}</span>
            <span>${item.price * item.qty} руб.</span>
        </div>`;
    }).join('');
    document.getElementById('total-amount').innerText = total;
    tg.MainButton.setText("✅ Подтвердить заказ");
}

function hideOrder() {
    document.getElementById('order-screen').classList.add('hidden');
    showCategories();
}

async function submitOrder() {
    const name = document.getElementById('user-name').value;
    const surname = document.getElementById('user-surname').value;
    const date = document.getElementById('order-date').value;

    if (!name || !surname || !date) return tg.showAlert("Заполните форму!");

    tg.MainButton.showProgress();
    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        order_details: {
            customer: { name, surname, date },
            products: Object.values(cart),
            total_price: Object.values(cart).reduce((s, p) => s + p.price * p.qty, 0)
        }
    };

    try {
        await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        tg.close();
    } catch (e) {
        tg.showAlert("Ошибка!");
    }
}

initCategories();
