const tg = window.Telegram.WebApp;
tg.expand();

const API_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/api/products';
const SERVER_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data';
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
        const response = await fetch(`${API_URL}?v=${Date.now()}`, {
            method: 'GET',
            headers: h
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        productsData = await response.json();
        initCategories();
    } catch (e) {
        tg.showAlert("Ошибка: " + e.message);
        initCategories();
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
    hideAllScreens();
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
            const imgPath = p.img || 'img/no-photo.jpg';
            const art = p.art || '---';
            return `
            <div class="product-card">
                <img src="${imgPath}" class="product-img" onclick="showProductDetail(${p.id})" onerror="this.src='img/no-photo.jpg'">
                <div class="product-info">
                    <div class="product-title" onclick="showProductDetail(${p.id})">${p.name}</div>
                    <div class="product-art">арт. ${art}</div>
                    <div class="product-price">${p.price} руб.</div>
                    <div class="qty-wrapper">
                        <button class="qty-btn" onclick="changeQty(-1, ${p.id}, '${safeName}', ${p.price}, '${art}')">-</button>
                        <span id="qty-${p.id}">${cart[p.id]?.qty || 0}</span>
                        <button class="qty-btn" onclick="changeQty(1, ${p.id}, '${safeName}', ${p.price}, '${art}')">+</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    } else {
        list.innerHTML = '<p style="text-align:center; padding: 40px; color: #999; grid-column: 1/-1;">Пусто</p>';
    }
}

function showProductDetail(id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    hideAllScreens();
    const screen = document.getElementById('detail-screen');
    screen.classList.remove('hidden');
    const art = p.art || '---';
    const safeName = p.name.replace(/"/g, '&quot;');
    screen.innerHTML = `
        <div class="detail-container">
            <img src="${p.img}" class="detail-img" onerror="this.src='img/no-photo.jpg'">
            <h2>${p.name}</h2>
            <p class="detail-art">Артикул: ${art}</p>
            <p class="detail-desc">${p.description || 'Описание отсутствует'}</p>
            <div class="detail-price">${p.price} руб.</div>
            <button class="main-btn-alt" onclick="changeQty(1, ${p.id}, '${safeName}', ${p.price}, '${art}'); showCategories();">В корзину и назад</button>
        </div>
    `;
    tg.BackButton.show();
    tg.BackButton.onClick(() => showProducts(p.category_id, "Назад"));
}

function showCategories() {
    hideAllScreens();
    document.getElementById('categories-screen').classList.remove('hidden');
    tg.BackButton.hide();
}

function hideAllScreens() {
    ['categories-screen', 'products-screen', 'order-screen', 'detail-screen'].forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });
}

function changeQty(delta, id, name, price, art) {
    if (!cart[id]) cart[id] = { name, price, art, qty: 0 };
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
    if (orderScreen && !orderScreen.classList.contains('hidden')) submitOrder();
    else showOrder();
});

function showOrder() {
    hideAllScreens();
    document.getElementById('order-screen').classList.remove('hidden');
    const container = document.getElementById('cart-items');
    let total = 0;
    if (container) {
        container.innerHTML = Object.values(cart).map(item => {
            total += item.price * item.qty;
            return `<div class="cart-row">
                <span>${item.name} [${item.art}] x${item.qty}</span>
                <span>${item.price * item.qty} р.</span>
            </div>`;
        }).join('');
    }
    document.getElementById('total-amount').innerText = total;
    tg.MainButton.setText("✅ Отправить заказ");
}

function hideOrder() {
    showCategories();
}

function toggleAddress(show) {
    const addr = document.getElementById('user-address');
    if (show) {
        addr.classList.remove('hidden');
    } else {
        addr.classList.add('hidden');
        addr.value = '';
    }
}

async function submitOrder() {
    const name = document.getElementById('user-name')?.value;
    const surname = document.getElementById('user-surname')?.value;
    const date = document.getElementById('order-date')?.value;
    const wishes = document.getElementById('user-wishes')?.value;
    const photoFile = document.getElementById('user-photo')?.files[0];
    const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
    const address = document.getElementById('user-address')?.value;

    if (!name || !surname || !date || (deliveryType === 'delivery' && !address)) {
        tg.showAlert("Заполните имя, фамилию, дату и адрес (при доставке)!");
        return;
    }

    tg.MainButton.showProgress();
    let uploadedPhoto = null;

    if (photoFile) {
        try {
            const formData = new FormData();
            formData.append('file', photoFile);
            const uploadRes = await fetch('/api/admin/upload', { method: 'POST', body: formData });
            const uploadData = await uploadRes.json();
            uploadedPhoto = uploadData.img_path;
        } catch (e) {
            console.error("Photo upload failed", e);
        }
    }

    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        order_details: {
            customer: {
                name,
                surname,
                date,
                wishes,
                photo: uploadedPhoto,
                delivery_type: deliveryType === 'delivery' ? 'Доставка' : 'Самовывоз',
                address: address || 'Самовывоз'
            },
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
        else throw new Error("Ошибка сервера");
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert(e.message);
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);
