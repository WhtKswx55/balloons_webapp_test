const tg = window.Telegram.WebApp;
tg.expand(); // Раскрыть на весь экран

// --- ВАЖНО: Вставь сюда актуальную ссылку из ngrok ---
const SERVER_URL = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data'; 

let cart = []; // Корзина: [{ name: "Красный шар", price: 100, quantity: 2 }, ...]

// 1. Обновление количества товара в магазине
function updateQuantity(button, change) {
    const productCard = button.closest('.product-card');
    const productName = productCard.dataset.name;
    const productPrice = parseInt(productCard.dataset.price);
    const quantitySpan = productCard.querySelector('.quantity');
    
    let currentQuantity = parseInt(quantitySpan.innerText);
    let newQuantity = currentQuantity + change;

    if (newQuantity < 0) newQuantity = 0; // Не уходим в минус

    quantitySpan.innerText = newQuantity;

    // Добавляем/обновляем товар в корзине
    const existingItemIndex = cart.findIndex(item => item.name === productName);
    
    if (newQuantity > 0) {
        if (existingItemIndex !== -1) {
            cart[existingItemIndex].quantity = newQuantity;
        } else {
            cart.push({ name: productName, price: productPrice, quantity: newQuantity });
        }
    } else { // Если количество стало 0, удаляем из корзины
        if (existingItemIndex !== -1) {
            cart.splice(existingItemIndex, 1);
        }
    }
    
    updateMainButton(); // Обновляем текст главной кнопки Telegram
    
    // Вибрация телефона при изменении
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// 2. Управление главной кнопкой (MainButton) Telegram
function updateMainButton() {
    if (cart.length > 0) {
        // Рассчитываем общую сумму из всех товаров в корзине
        const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        tg.MainButton.setText(`Корзина: ${total} руб. (Оформить)`);
        tg.MainButton.show();
    } else {
        tg.MainButton.hide();
    }
}

// 3. Нажатие на главную кнопку Telegram
tg.MainButton.onClick(() => {
    // Если мы в магазине - идем в корзину
    if (document.getElementById('shop-screen').style.display !== 'none') {
        showOrderScreen();
    } 
    // Если мы в корзине - пытаемся отправить заказ
    else {
        submitOrder();
    }
});

// Переключение экранов: Магазин <-> Корзина
function showOrderScreen() {
    document.getElementById('shop-screen').style.display = 'none';
    document.getElementById('order-screen').style.display = 'block';
    document.getElementById('order-screen').classList.remove('hidden');
    
    // Рендер товаров в корзине
    const cartDiv = document.getElementById('cart-items');
    // Считаем общую сумму для отображения в корзине
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    cartDiv.innerHTML = cart.map((item, index) => 
        `<div class="cart-item">
            <span>${item.name} x ${item.quantity}</span>
            <span class="item-price">${item.price * item.quantity} руб.</span>
        </div>`
    ).join('');
    
    document.getElementById('total-amount').innerText = totalAmount;
    
    // Меняем текст кнопки на "Подтвердить и отправить"
    tg.MainButton.setText("✅ Подтвердить и отправить");
}

function toggleScreen() {
    // Возврат в магазин
    document.getElementById('shop-screen').style.display = 'block';
    document.getElementById('order-screen').style.display = 'none';
    updateMainButton(); // Обновляем кнопку для магазина
}

// 4. Отправка заказа на сервер
async function submitOrder() {
    const name = document.getElementById('user-name').value.trim();
    const surname = document.getElementById('user-surname').value.trim();
    const date = document.getElementById('order-date').value;

    // Валидация полей формы
    if (!name || !surname || !date) {
        tg.showAlert("Пожалуйста, заполните все обязательные поля!");
        return;
    }
    if (cart.length === 0) {
        tg.showAlert("Ваша корзина пуста!");
        return;
    }

    tg.MainButton.showProgress(); // Показываем крутилку загрузки

    const dataToSend = {
        user_id: tg.initDataUnsafe.user?.id,
        user_name: tg.initDataUnsafe.user?.first_name || name, // Имя из Telegram или из формы
        order_details: {
            customer: { name, surname, date },
            products: cart,
            total_price: cart.reduce((acc, item) => acc + (item.price * item.quantity), 0)
        }
    };

    try {
        const response = await fetch(SERVER_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ngrok-skip-browser-warning': 'true' // Обход заглушки ngrok
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            tg.MainButton.hideProgress();
            tg.showAlert("Ваш заказ успешно оформлен!");
            tg.close(); // Закрываем WebApp после успешного заказа
        } else {
            tg.MainButton.hideProgress();
            tg.showAlert("Ошибка при оформлении заказа. Попробуйте снова.");
        }
    } catch (error) {
        tg.MainButton.hideProgress();
        tg.showAlert("Ошибка соединения: " + error.message);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', updateMainButton);