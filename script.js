const tg = window.Telegram.WebApp;
tg.expand();

const SERVER_BASE = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev';
const API_URL = `${SERVER_BASE}/api/products`;
const SERVER_URL = `${SERVER_BASE}/webhook_data`;
const h = { "ngrok-skip-browser-warning": "69420" };

let cart = {};
let productsData = [];
const categories = [
    { id: 'feb14', name: '14 февраля', img: 'img/14feb.jpg' },
    { id: '23and8', name: '8 марта и 23 февраля', img: 'img/23and8.jpg' },
    { id: 'school', name: 'Школьные шарики', img: 'img/school.jpg' },
    { id: 'gender', name: 'Гендерные шарики', img: 'img/gender.jpg' },
    { id: 'bday', name: 'День рождения', img: 'img/bday.jpg' },
    { id: 'vipiska', name: 'На выписку', img: 'img/vipiska.jpg' },
    { id: 'other', name: 'Другое', img: 'img/other.jpg' }
];

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?v=${Date.now()}`, { method: 'GET', headers: h });
        productsData = await response.json();
        initCategories();
    } catch (e) {
        tg.showAlert("Ошибка загрузки: " + e.message);
        initCategories();
    }
}

function getFullImgPath(path) {
    if (!path) return 'img/no-photo.jpg';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return SERVER_BASE + cleanPath;
}

function hideAllScreens() {
    ['categories-screen', 'products-screen', 'order-screen', 'detail-screen'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
}

function initCategories() {
    hideAllScreens();
    document.getElementById('categories-screen').classList.remove('hidden');
    tg.BackButton.hide();
    tg.MainButton.offClick(handleMainButtonClick);
    updateMainButton();
    const list = document.getElementById('categories-list');
    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="showProducts('${cat.id}', '${cat.name}')">
            <img src="${cat.img}" class="category-img" onerror="this.src='img/no-photo.jpg'">
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
}

function showProducts(catId, catName) {
    window.scrollTo(0, 0);
    hideAllScreens();
    const screen = document.getElementById('products-screen');
    screen.classList.remove('hidden');
    
    screen.querySelector('.main-header').innerHTML = `
        <div class="header-left">
            <button class="header-btn" onclick="initCategories()">← Назад</button>
        </div>
        <h2 id="category-title">${catName}</h2>
        <div style="width:80px;"></div>
    `;

    tg.BackButton.show();
    tg.BackButton.offClick(initCategories);
    tg.BackButton.onClick(initCategories);

    const list = document.getElementById('products-list');
    const items = productsData.filter(p => String(p.category_id) === String(catId));

    list.innerHTML = items.length > 0 ? items.map(p => `
        <div class="product-card">
            <img src="${getFullImgPath(p.img)}" class="product-img" onclick="showProductDetail(${p.id})" onerror="this.src='img/no-photo.jpg'">
            <div class="product-info">
                <div class="product-title" onclick="showProductDetail(${p.id})">${p.name}</div>
                <div class="product-art">арт. ${p.art || '---'}</div>
                <div class="product-price">${p.price} руб.</div>
                <div class="qty-wrapper">
                    <button class="qty-btn" onclick="updateQty(-1, ${p.id})">-</button>
                    <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
                    <button class="qty-btn" onclick="updateQty(1, ${p.id})">+</button>
                </div>
            </div>
        </div>`).join('') : '<p style="grid-column:1/-1; text-align:center; padding:40px;">Пусто 🎈</p>';
}

function showProductDetail(id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    hideAllScreens();
    const screen = document.getElementById('detail-screen');
    screen.classList.remove('hidden');

    const imgUrl = getFullImgPath(p.img);

    screen.innerHTML = `
        <div class="main-header">
            <div class="header-left">
                <button class="header-btn" onclick="showProducts('${p.category_id}', 'Назад')">← Назад</button>
            </div>
            <h2>Детали</h2>
            <div style="width:80px;"></div>
        </div>
        <div class="detail-container">
            <img src="${imgUrl}" class="detail-img" onclick="openImageViewer('${imgUrl}')" onerror="this.src='img/no-photo.jpg'">
            <div class="detail-info-block">
                <div class="detail-art">Артикул: ${p.art || '---'}</div>
                <h2 style="margin:10px 0;">${p.name}</h2>
                <div class="detail-price" style="color:var(--primary-color); font-weight:800; font-size:24px; margin-bottom:15px;">${p.price} руб.</div>
                <div class="detail-desc" style="text-align:center; margin-bottom:25px;">${p.description || 'Описание уточняйте у менеджера ✨'}</div>
                <button class="main-btn-alt" onclick="updateQty(1, ${p.id}); initCategories();">🛒 В корзину и назад</button>
            </div>
        </div>
    `;

    tg.BackButton.show();
    tg.BackButton.offClick();
    tg.BackButton.onClick(() => showProducts(p.category_id, "Назад"));
}

function updateQty(delta, id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    if (!cart[id]) {
        cart[id] = { ...p, qty: 0 };
    }
    cart[id].qty += delta;
    if (cart[id].qty <= 0) delete cart[id];

    const label = document.getElementById(`qty-${id}`);
    if (label) label.innerText = cart[id]?.qty || 0;
    updateMainButton();
}

function updateMainButton() {
    const total = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
    tg.MainButton.offClick(handleMainButtonClick);
    if (total > 0) {
        tg.MainButton.setText(`Оформить заказ: ${total} руб.`);
        tg.MainButton.show();
        tg.MainButton.onClick(handleMainButtonClick);
    } else {
        tg.MainButton.hide();
    }
}

function handleMainButtonClick() {
    if (!document.getElementById('order-screen').classList.contains('hidden')) {
        submitOrder();
    } else {
        showOrder();
    }
}

function showOrder() {
    hideAllScreens();
    document.getElementById('order-screen').classList.remove('hidden');
    
    const header = document.querySelector('#order-screen .main-header');
    header.innerHTML = `
        <div class="header-left">
            <button class="header-btn" onclick="initCategories()">← В магазин</button>
        </div>
        <h2>Оформление</h2>
        <div style="width:80px;"></div>
    `;

    const container = document.getElementById('cart-items');
    container.innerHTML = Object.values(cart).map(item => `
        <div class="cart-item">
            <img src="${getFullImgPath(item.img)}" class="cart-thumb" onerror="this.src='img/no-photo.jpg'">
            <div class="cart-info">
                <div class="cart-name">${item.name}</div>
                <div class="cart-price" style="color:var(--primary-color); font-weight:700;">${item.price} ₽</div>
                <div class="cart-controls">
                    <button class="qty-btn" onclick="updateQtyCart(-1, ${item.id})">-</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${item.qty}</span>
                    <button class="qty-btn" onclick="updateQtyCart(1, ${item.id})">+</button>
                </div>
            </div>
            <button onclick="updateQtyCart(-999, ${item.id})" style="background:none; border:none; color:red; font-size:22px;">✕</button>
        </div>`).join('') || '<p style="text-align:center; padding:40px;">В корзине пусто</p>';

    document.getElementById('total-amount').innerText = Object.values(cart).reduce((s, i) => s + (i.price * i.qty), 0);
    tg.MainButton.setText("✅ Отправить заказ");

    tg.BackButton.show();
    tg.BackButton.offClick();
    tg.BackButton.onClick(initCategories);
}

function updateQtyCart(delta, id) {
    updateQty(delta, id);
    showOrder();
}

function openImageViewer(url) {
    const viewer = document.getElementById('image-viewer');
    const fullImg = document.getElementById('full-image');
    if (viewer && fullImg) {
        fullImg.src = url;
        viewer.classList.add('active');
    }
}

function closeImageViewer() {
    const viewer = document.getElementById('image-viewer');
    if (viewer) viewer.classList.remove('active');
}

async function submitOrder() {
    const name = document.getElementById('user-name').value;
    const surname = document.getElementById('user-surname').value;
    const date = document.getElementById('order-date').value;
    const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
    const address = document.getElementById('user-address').value;

    if (!name || !surname || !date || (deliveryType === 'delivery' && !address)) {
        tg.showAlert("Заполните поля!");
        return;
    }

    tg.MainButton.showProgress();
    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        order_details: {
            customer: { name, surname, date, delivery_type: deliveryType, address: address || 'Самовывоз' },
            products: Object.values(cart),
            total_price: Object.values(cart).reduce((s, p) => s + (p.price * p.qty), 0)
        }
    };

    try {
        const res = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { ...h, 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) tg.close();
        else throw new Error("Сервер вернул ошибку");
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка отправки: " + e.message);
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);
