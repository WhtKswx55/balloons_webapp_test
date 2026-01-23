const tg = window.Telegram.WebApp;
tg.expand();

try {
    tg.setHeaderColor('#ffffff');
    tg.setBackgroundColor('#ffffff');
} catch(e) {}

const SERVER_URL = '/webhook_data';
const API_URL = '/api/products';
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "69420" };

let cart = {};
let productsData = [];
let categories = [
    { id: 'feb14', name: '14 февраля', img: '/img/feb14.jpg' },
    { id: 'bday', name: 'День рождения', img: '/img/bday.jpg' },
    { id: 'other', name: 'Другое', img: '/img/other.jpg' }
];

async function loadProducts() {
    try {
        const response = await fetch(API_URL, { headers: NGROK_HEADERS });
        if (!response.ok) throw new Error();
        productsData = await response.json();
        initCategories();
    } catch (e) {
        tg.showAlert("Ошибка загрузки товаров");
    }
}

function initCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="showProducts('${cat.id}', '${cat.name}')">
            <img src="${cat.img}" class="category-img" onerror="this.src='/img/no-photo.jpg'">
            <span class="category-name">${cat.name}</span>
        </div>
    `).join('');
}

function showProducts(catId, catName) {
    window.scrollTo(0,0);
    document.getElementById('categories-screen').classList.add('hidden');
    document.getElementById('products-screen').classList.remove('hidden');
    document.getElementById('order-screen').classList.add('hidden');
    document.getElementById('category-title').innerText = catName;

    tg.BackButton.show();
    tg.BackButton.onClick(showCategories);

    const list = document.getElementById('products-list');
    const items = productsData.filter(p => String(p.category_id) === String(catId));

    if (items.length === 0) {
        list.innerHTML = '<p style="grid-column: 1/3; text-align:center; padding: 20px;">Товаров пока нет</p>';
        return;
    }

    list.innerHTML = items.map(p => {
        const safeName = p.name.replace(/"/g, '&quot;').replace(/'/g, "\\'");
        const imageSrc = p.img ? (p.img.startsWith('/') ? p.img : '/' + p.img) : '/img/no-photo.jpg';
        
        return `
        <div class="product-card">
            <img src="${imageSrc}" class="product-img" onclick="openImage(this.src)" onerror="this.src='/img/no-photo.jpg'">
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
        </div>`;
    }).join('');
}

function showCategories() {
    document.getElementById('categories-screen').classList.remove('hidden');
    document.getElementById('products-screen').classList.add('hidden');
    document.getElementById('order-screen').classList.add('hidden');
    tg.BackButton.hide();
    updateMainButton();
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
        tg.MainButton.setText(document.getElementById('order-screen').classList.contains('hidden') ? `В корзину: ${total} руб.` : "✅ Подтвердить заказ");
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
    tg.BackButton.show();
    tg.BackButton.onClick(showCategories);
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
    updateMainButton();
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
                name: item.name, price: item.price, qty: item.qty, art: item.art, sum: item.price * item.qty
            })),
            total_price: Object.values(cart).reduce((s, p) => s + (p.price * p.qty), 0)
        }
    };
    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...NGROK_HEADERS },
            body: JSON.stringify(data)
        });
        if (response.ok) tg.close();
        else throw new Error();
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка отправки!");
    }
}

function initImageViewer() {
    if (document.getElementById('image-viewer')) return;
    const v = document.createElement('div');
    v.id = 'image-viewer';
    v.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:none;z-index:10000;align-items:center;justify-content:center;";
    v.innerHTML = `<img id="full-image" style="max-width:95%;max-height:80%;border-radius:8px;"><button onclick="closeImage()" style="position:absolute;top:20px;right:20px;color:white;background:none;border:none;font-size:24px;">✕</button>`;
    v.onclick = (e) => { if (e.target.id === 'image-viewer') closeImage(); };
    document.body.appendChild(v);
}

function openImage(src) {
    if (!src || src.includes('no-photo')) return;
    document.getElementById('full-image').src = src;
    document.getElementById('image-viewer').style.display = 'flex';
}

function closeImage() {
    document.getElementById('image-viewer').style.display = 'none';
}

loadProducts();
initImageViewer();
