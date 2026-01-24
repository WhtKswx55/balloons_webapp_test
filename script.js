const tg = window.Telegram.WebApp;
tg.expand();

tg.setHeaderColor('#ffffff');
tg.setBackgroundColor('#ffffff');

const API_BASE = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev';
const API_URL = `${API_BASE}/api/products`;
const SERVER_URL = `${API_BASE}/webhook_data`;
const h = { "ngrok-skip-browser-warning": "69420" };

let cart = {};
let productsData = [];
let currentCategory = null;

const categories = [
    { id: 'feb14', name: '14 февраля', img: 'img/14feb.jpg' },
    { id: '23and8', name: '8 марта и 23 февраля', img: 'img/23and8.jpg'},
    { id: 'school', name: 'Школьные шарики', img: 'img/school.jpg'},
    { id: 'gender', name: 'Гендерные шарики', img: 'img/gender.jpg'},
    { id: 'bday', name: 'День рождения', img: 'img/bday.jpg' },
    { id: 'vipiska', name: 'На выписку', img: 'img/vipiska.jpg'},
    { id: 'other', name: 'Другое', img: 'img/other.jpg' }
];

function initCategories() {
    const list = document.getElementById('categories-list');
    if (!list) return;
    
    list.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="showProducts('${cat.id}', '${cat.name}')">
            <img src="${cat.img}" class="category-img" onerror="this.src='img/no-photo.jpg'">
            <div class="category-name">${cat.name}</div>
        </div>
    `).join('');
    
    tg.BackButton.hide();
}

async function loadProducts() {
    try {
        const response = await fetch(`${API_URL}?v=${Date.now()}`, {
            method: 'GET',
            headers: h
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        productsData = await response.json();
    } catch (e) {
        console.error(e);
        tg.showAlert("Не удалось загрузить товары.");
    }
}

function showProducts(catId, catName) {
    currentCategory = catId;
    window.scrollTo(0, 0);
    hideAllScreens();
    document.getElementById('products-screen').classList.remove('hidden');
    document.getElementById('category-title').innerText = catName;
    
    tg.BackButton.show();
    tg.BackButton.offClick(showCategories);
    tg.BackButton.offClick(goBackFromDetail);
    tg.BackButton.onClick(showCategories);

    const list = document.getElementById('products-list');
    if (!list) return;

    const items = productsData.filter(p => String(p.category_id) === String(catId));
    
    if (items.length > 0) {
        list.innerHTML = items.map(p => {
            const safeName = p.name.replace(/"/g, '&quot;');
            const imgPath = p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE}/${p.img}`) : 'img/no-photo.jpg';
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
        list.innerHTML = '<p style="text-align:center; padding: 40px; color: #999; grid-column: 1/-1;">В этой категории пока пусто</p>';
    }
}

function showProductDetail(id) {
    const p = productsData.find(x => x.id === id);
    if (!p) return;
    
    hideAllScreens();
    const screen = document.getElementById('detail-screen');
    screen.classList.remove('hidden');
    window.scrollTo(0,0);
    
    tg.BackButton.show();
    tg.BackButton.offClick(showCategories);
    tg.BackButton.onClick(goBackFromDetail);
    
    const art = p.art || '---';
    const safeName = p.name.replace(/"/g, '&quot;');
    const imgPath = p.img ? (p.img.startsWith('http') ? p.img : `${API_BASE}/${p.img}`) : 'img/no-photo.jpg';

    document.getElementById('product-detail-content').innerHTML = `
        <div class="detail-container">
            <img src="${imgPath}" class="detail-img" onclick="openImageViewer('${imgPath}')" onerror="this.src='img/no-photo.jpg'">
            <h2>${p.name}</h2>
            <p class="detail-art">Артикул: ${art}</p>
            <p class="detail-desc">${p.description || 'Описание отсутствует'}</p>
            <div class="detail-price">${p.price} руб.</div>
            <button class="main-btn-alt" onclick="changeQty(1, ${p.id}, '${safeName}', ${p.price}, '${art}'); goBackFromDetail();">В корзину</button>
        </div>
    `;
}

function goBackFromDetail() {
    if (currentCategory) {
        showProducts(currentCategory, "Назад");
    } else {
        showCategories();
    }
}

function showCategories() {
    hideAllScreens();
    document.getElementById('categories-screen').classList.remove('hidden');
    tg.BackButton.hide();
    tg.BackButton.offClick(showCategories);
    tg.BackButton.offClick(goBackFromDetail);
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
    if (orderScreen && !orderScreen.classList.contains('hidden')) {
        submitOrder();
    } else {
        showOrder();
    }
});

function showOrder() {
    hideAllScreens();
    document.getElementById('order-screen').classList.remove('hidden');
    window.scrollTo(0,0);

    tg.BackButton.show();
    tg.BackButton.offClick(showCategories);
    tg.BackButton.offClick(goBackFromDetail);
    tg.BackButton.onClick(hideOrder);

    const container = document.getElementById('cart-items');
    let total = 0;
    
    if (container) {
        if (Object.keys(cart).length === 0) {
            container.innerHTML = "<p style='text-align:center; color:#999'>Корзина пуста</p>";
        } else {
            container.innerHTML = Object.values(cart).map(item => {
                const subtotal = item.price * item.qty;
                total += subtotal;
                return `
                <div class="cart-row">
                    <div style="flex:1">
                        <b>${item.name}</b><br>
                        <span style="font-size:13px; color:#666">арт. ${item.art}</span>
                    </div>
                    <div style="text-align:right">
                        <div>${item.qty} x ${item.price}</div>
                        <b>${subtotal} р.</b>
                    </div>
                </div>`;
            }).join('');
        }
    }
    document.getElementById('total-amount').innerText = total;
    tg.MainButton.setText("✅ Подтвердить заказ");
}

function hideOrder() {
    if (currentCategory) showProducts(currentCategory, "Назад");
    else showCategories();
    updateMainButton();
}

function toggleAddress(show) {
    const addr = document.getElementById('user-address');
    if (show) addr.classList.remove('hidden');
    else addr.classList.add('hidden');
}

async function submitOrder() {
    const name = document.getElementById('user-name')?.value;
    const surname = document.getElementById('user-surname')?.value;
    const date = document.getElementById('order-date')?.value;
    const wishes = document.getElementById('user-wishes')?.value;
    const photoFile = document.getElementById('user-photo')?.files[0];
    const deliveryType = document.querySelector('input[name="delivery-type"]:checked')?.value;
    const address = document.getElementById('user-address')?.value;

    if (!name || !surname || !date) {
        tg.showAlert("Заполните имя, фамилию и дату!");
        return;
    }
    
    if (deliveryType === 'delivery' && !address) {
        tg.showAlert("Укажите адрес доставки!");
        return;
    }

    tg.MainButton.showProgress();
    let uploadedPhoto = null;

    if (photoFile) {
        try {
            const formData = new FormData();
            formData.append('file', photoFile);
            const uploadRes = await fetch(`${API_BASE}/api/admin/upload`, { method: 'POST', headers: h, body: formData });
            const uploadData = await uploadRes.json();
            uploadedPhoto = uploadData.img_path;
        } catch (e) {
            console.error(e);
        }
    }

    const data = {
        user_id: tg.initDataUnsafe.user?.id || 0,
        order_details: {
            customer: { 
                name, surname, date, wishes, 
                delivery: deliveryType === 'delivery' ? `Доставка: ${address}` : 'Самовывоз',
                photo: uploadedPhoto 
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
        if (response.ok) {
            tg.MainButton.hideProgress();
            tg.showPopup({
                title: 'Успешно!',
                message: 'Заказ отправлен менеджеру.',
                buttons: [{type: 'ok'}]
            }, function() {
                tg.close();
            });
        }
        else throw new Error("Server Error");
    } catch (e) {
        tg.MainButton.hideProgress();
        tg.showAlert(e.message);
    }
}

function openImageViewer(src) {
    const viewer = document.getElementById('image-viewer');
    const img = document.getElementById('full-image');
    img.src = src;
    viewer.classList.add('active');
    tg.BackButton.hide();
}

function closeImageViewer() {
    const viewer = document.getElementById('image-viewer');
    viewer.classList.remove('active');
    if(document.getElementById('detail-screen').classList.contains('hidden') === false) {
        tg.BackButton.show();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initCategories();
    loadProducts();
});
