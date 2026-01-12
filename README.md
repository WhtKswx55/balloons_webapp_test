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
        <p>Набор "динозавр" - 1500 руб.</p>
    </div>
    <button id="pay-btn">Оплатить корзину</button>

    <script>
        let tg = window.Telegram.WebApp;
        
        tg.ready();
        tg.expand();
        
        let payBtn = document.getElementById("pay-btn");
        
        payBtn.addEventListener("click", () => {
            let data = {
                details: "набор 'динозавр' (из WebApp)",
                price: 1500
            };
            
            try {
                tg.sendData(JSON.stringify(data));
                tg.close(); 
            } catch (error) {
                alert("ошибка отправки данных: " + error.message);
            }
        });
    </script>
</body>
</html>
