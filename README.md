<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Balloons Shop</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        body { font-family: sans-serif; background: var(--tg-theme-bg-color); color: var(--tg-theme-text-color); display: flex; flex-direction: column; align-items: center; padding: 20px; }
        .item { background: var(--tg-theme-secondary-bg-color); padding: 15px; border-radius: 12px; margin-bottom: 20px; width: 100%; text-align: center; }
        button { width: 100%; padding: 15px; background: var(--tg-theme-button-color); color: var(--tg-theme-button-text-color); border: none; border-radius: 10px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="item">
        <h2>Набор шаров</h2>
        <p>1500 руб.</p>
    </div>
    <button id="pay-btn">Оплатить заказ</button>

    <script>
        const tg = window.Telegram.WebApp;
        tg.ready();

        document.getElementById("pay-btn").addEventListener("click", async () => {
            const url = 'https://lynell-undelaying-exorbitantly.ngrok-free.dev/webhook_data';

            const data = {
                user_id: tg.initDataUnsafe.user?.id,
                user_name: tg.initDataUnsafe.user?.first_name || "Клиент",
                details: "Заказ набора шаров",
                price: 1500
            };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true' // Обход заглушки ngrok
                    },
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
