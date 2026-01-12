<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balloons Shop</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            margin: 0;
        }
        .container { width: 100%; max-width: 400px; }
        .item {
            background-color: var(--tg-theme-secondary-bg-color, #f0f0f0);
            padding: 15px;
            border-radius: 12px;
            margin-bottom: 20px;
            text-align: center;
        }
        button {
            width: 100%;
            padding: 15px;
            background-color: var(--tg-theme-button-color, #248bed);
            color: var(--tg-theme-button-text-color, #ffffff);
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="item">
            <h2>Набор "Звездное небо"</h2>
            <p>1500 руб.</p>
        </div>
        <button id="pay-btn">Оплатить корзину</button>
    </div>

    <script>
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        document.getElementById("pay-btn").addEventListener("click", async () => {
            const data = {
                user_id: tg.initDataUnsafe.user?.id,
                user_name: tg.initDataUnsafe.user?.first_name || "Клиент",
                details: "Набор 'Звездное небо' (из WebApp)",
                price: 1500
            };

            const url = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev';

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    tg.close();
                } else {
                    alert("Ошибка сервера: " + response.status);
                }
            } catch (error) {
                alert("Ошибка соединения: " + error.message);
            }
        });
    </script>
</body>
</html>
