const tg = window.Telegram.WebApp;
tg.expand();

const SERVER_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data';

let cart = [];

function addToCart(name, price) {
    cart.push({ name, price });
    updateMainButton();

    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

function updateMainButton() {
    if (cart.length > 0) {
        const total = cart.reduce((acc, item) => acc + item.price, 0);
        tg.MainButton.setText(`Корзина: ${total} руб. (Оформить)`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

tg.MainButton.onClick(() => {
    if (document.getElementById('shop-screen').style.display !== 'none') {
        showOrderScreen();
    }

    else {
        submitOrder();
    }
});

function showOrderScreen() {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('order-screen').style.display = 'block';
    document.getElementById('order-screen').classList.remove('hidden');

    const cartDiv = document.getElementById('cart-items');
    cartDiv.innerHTML = cart.map(item =>
        `<div class="cart-item"><span>${item.name}</span><span>${item.price} руб.</span></div>`
    ).join('');

    document.getElementById('total-amount').innerText = cart.reduce((acc, item) => acc + item.price, 0);

    tg.MainButton.setText("✅ Подтвердить и отправить");
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
        tg.showAlert("Пожалуйста, заполните Имя, Фамилию и Дату!");
        return;
    }

    tg.MainButton.showProgress();

    const data = {
        user_id: tg.initDataUnsafe.user?.id,
        user_name: tg.initDataUnsafe.user?.first_name,
        order_details: {
            customer: { name, surname, date },
            products: cart,
            total_price: cart.reduce((acc, item) => acc + item.price, 0)
        }
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            tg.MainButton.hideProgress();
            tg.close();
        } else {
            tg.MainButton.hideProgress();
            tg.showAlert("Ошибка сервера!");
        }
    } catch (error) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка соединения: " + error.message);
    }

}
