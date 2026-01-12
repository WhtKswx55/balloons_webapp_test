<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Тест Заказа</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
</head>
<body>

    <h2>Тестовый каталог</h2>
    <div style="border: 1px solid #000; padding: 10px; margin-bottom: 10px;">
        <p>Набор шаров "Праздник"</p>
        <p>Цена: 1200 руб.</p>
        <button id="buy-btn">Купить (Тест)</button>
    </div>

    <script>
        let tg = window.Telegram.WebApp;
        tg.expand();

        let buyBtn = document.getElementById("buy-btn");

        buyBtn.addEventListener("click", function(){
            let data = {
                items: [{name: "Набор шаров Праздник", price: 1200}],
                total: 1200
            };

            tg.sendData(JSON.stringify(data));

            tg.close();
        });
    </script>
</body>
</html>
