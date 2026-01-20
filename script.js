const tg = window.Telegram.WebApp;
tg.expand();

tg.setHeadColor('#ffffff');
tg.setBackgroundColor('#ffffff')

const SERVER_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data';

let cart = {};


function changeQty(delta, name, price) {
    if (!cart[name]) {
        cart[name] = { price: price, qty: 0 };
    }

    cart[name].qty += delta;

    if (cart[name].qty < 0) cart[name].qty = 0;

    const label = document.getElementById(`qty-${name}`);
    if (label) label.innerText = cart[name].qty;

    if (cart[name].qty === 0) delete cart[name];

    updateMainButton();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
}

function updateMainButton() {
    let total = 0;
    for (let id in cart) {
        total += cart[id].price * cart[id].qty;
    }

    if (total > 0) {
        tg.MainButton.setText(`Оформить заказ: ${total} руб.`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

function showOrderScreen() {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('order-screen').style.display = 'block';
    document.getElementById('order-screen').classList.remove('hidden');

    const container = document.getElementById('cart-items');
    container.innerHTML = '';
    let total = 0;

    for (let name in cart) {
        const item = cart[name];
        const cost = item.price * item.qty;
        total += cost;
        container.innerHTML += `
            <div class="cart-row">
                <span>${name} x ${item.qty}</span>
                <span>${cost} руб.</span>
            </div>`;
    }
    document.getElementById('total-amount').innerText = total;
    tg.MainButton.setText("✅ Отправить заказ");
}

function toggleScreen() {
    document.getElementById('shop-screen').style.display = 'block';
    document.getElementById('order-screen').style.display = 'none';
    updateMainButton();
}

async function submitOrder() {
    const name = document.getElementById('user-name').value;
    const surname = document.getElementById('user-surname').value;
    const date = document.getElementById('order-date').value;

    if (!name || !surname || !date) {
        tg.showAlert("Заполните все поля формы!");
        return;
    }

    tg.MainButton.showProgress();

    const products = Object.keys(cart).map(name => ({
        name: name,
        price: cart[name].price,
        quantity: cart[name].qty
    }));

    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        order_details: {
            customer: { name, surname, date },
            products: products,
            total_price: products.reduce((sum, p) => sum + (p.price * p.quantity), 0)
        }
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
            body: JSON.stringify(data)
        });
        if (response.ok) tg.close();
        else tg.showAlert("Ошибка сервера!");
    } catch (e) {
        tg.showAlert("Ошибка: " + e.message);
    }
    tg.MainButton.hideProgress();
}

tg.MainButton.onClick(() => {
    if (document.getElementById('shop-screen').style.display !== 'none') {
        showOrderScreen();
    } else {
        submitOrder();
    }
});
