const tg = window.Telegram.WebApp;
tg.expand();

try {
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
} catch(e) {}

const SERVER_URL = '/webhook_data';
const API_URL = '/api/products';

const NGROK_HEADERS = {
    "ngrok-skip-browser-warning": "true"
};

let cart = {};
let productsData = [];
let categories = [
    { id: 'feb14', name: '14 февраля', img: 'img/feb14.jpg' },
    { id: 'bday', name: 'День рождения', img: 'img/bday.jpg' },
    { id: 'other', name: 'Другое', img: 'img/other.jpg' }
];

async function loadProducts() {
    try {
        const response = await fetch(API_URL, {
            headers: NGROK_HEADERS
        });
        if (!response.ok) throw new Error('Ошибка сервера');
        productsData = await response.json();
        initCategories();
    } catch (e) {
        console.error(e);
        tg.showAlert("Не удалось загрузить товары");
    }
}

async function loadOrders() {
    try {
        const res = await fetch('/api/admin/orders', { 
            headers: NGROK_HEADERS 
        });
        const data = await res.json();
        const list = document.getElementById('orders-list');
        
        if (data.length === 0) {
            list.innerHTML = '<p style="padding: 20px; text-align: center;">Заказов пока нет</p>';
            return;
        }

        list.innerHTML = data.map(o => `
            <div class="order-card" style="border-left: 5px solid ${o.status === 'в обработке' ? '#ffc107' : '#28a745'};">
                <div style="display: flex; justify-content: space-between;">
                    <b>Заказ №${o.id}</b>
                    <span class="status-badge">${o.status}</span>
                </div>
                <div style="margin-top: 10px; font-size: 14px;">
                    ${o.details.replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error(e);
        document.getElementById('orders-list').innerText = "Ошибка связи с сервером";
    }
}

function initImageViewer() {
    const viewer = document.createElement('div');
    viewer.id = 'image-viewer';
    viewer.innerHTML = `
        <img id="full-image" src="">
        <button id="close-btn" onclick="closeImage()">Закрыть ✕</button>
    `;
    viewer.onclick = (e) => {
        if (e.target.id === 'image-viewer') closeImage();
    };
    document.body.appendChild(viewer);
}

function openImage(src) {
    if (!src || src.includes('placeholder') || src.includes('no-photo')) return;
    document.getElementById('full-image').src = src;
    document.getElementById('image-viewer').classList.add('active');
    tg.BackButton.show();
    tg.BackButton.onClick(closeImage);
}

function closeImage() {
    document.getElementById('image-viewer').classList.remove('active');
    if (document.getElementById('products-screen').classList.contains('hidden')) {
        tg.BackButton.hide();
    } else {
        tg.BackButton.show();
        tg.BackButton.onClick(showCategories);
    }
}

function initCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;
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

    tg.BackButton.show();
    tg.BackButton.onClick(showCategories);

    const list = document.getElementById('products-list');
    const items = productsData.filter(p => p.category_id === catId);

    list.innerHTML = items.length ? items.map(p => {
        const safeName = p.name.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        return `
        <div class="product-card">
            <img src="${p.img || 'img/no-photo.jpg'}" class="product-img" onclick="openImage(this.src)">
            <div class="product-info">
                <div class="product-top-details">
                    <div class="product-title">${p.name}</div>
                    <div class="product-art">арт. ${p.art || '---'}</div>
                </div>
                <div class="product-price">${p.price} руб.</div>
                <div class="qty-wrapper">
                    <button class="qty-btn" onclick="changeQty(-1, ${p.id}, '${safeName}', ${p.price}, '${p.art}')">-</button>
                    <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
                    <button class="qty-btn" onclick="changeQty(1, ${p.id}, '${safeName}', ${p.price}, '${p.art}')">+</button>
                </div>
            </div>
        </div>
        `;}).join('') : '<p style="grid-column: 1/3; text-align:center; padding: 20px;">Скоро добавим товары!</p>';
}

function showCategories() {
    document.getElementById('categories-screen').classList.remove('hidden');
    document.getElementById('products-screen').classList.add('hidden');
    document.getElementById('order-screen').classList.add('hidden');
    tg.BackButton.hide();
}

function changeQty(delta, id, name, price, art) {
    if (!cart[id]) cart[id] = { name, price, qty: 0, art };
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
    document.getElementById('categories-screen').classList.add('hidden');
    document.getElementById('products-screen').classList.add('hidden');
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
            products: Object.values(cart).map(item => ({
                name: item.name,
                price: item.price,
                quantity: item.qty,
                qty: item.qty,
                art: item.art,
                sum: item.price * item.qty
            })),
            total_price: Object.values(cart).reduce((s, p) => s + (p.price * p.qty), 0)
        }
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...NGROK_HEADERS
            },
            body: JSON.stringify(data)
        });
        if (response.ok) {
            tg.close();
        } else {
            throw new Error('Server error');
        }
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка при отправке!");
    }
}

loadProducts();
initImageViewer();
