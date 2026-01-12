<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body { font-family: sans-serif; background-color: var(--tg-theme-bg-color); color: var(--tg-theme-text-color); padding: 20px; }
        button { width: 100%; padding: 10px; background: #31b545; color: white; border: none; border-radius: 5px; cursor: pointer; }
    </style>
</head>
<body>
    <h2>Корзина шаров </h2>
    <div id="cart">
        <p>Набор "Звездное небо" - 1500 руб.</p>
    </div>
    <button id="pay-btn">Оплатить корзину</button>

    <script>
        let tg = window.Telegram.WebApp;
        tg.expand();

        document.getElementById("pay-btn").addEventListener("click", () => {
            let data = {
                details: "Набор 'Звездное небо' (из WebApp)",
                price: 1500
            };
            tg.sendData(JSON.stringify(data));
        });
    </script>
</body>
</html>
