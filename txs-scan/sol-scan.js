import fetch from "node-fetch"; // Установи: npm install node-fetch

const API_KEY = "XDSUUM3RW5S657UI9IAINQTDZHWN87C5MN"; // 🔹 Твой API-ключ с PolygonScan
const CONTRACT_ADDRESS = "0x9EC7D96636A7406C42fF1ec0AF6E12C39E3A11D0"; // 🔹 Адрес кошелька, который анализируем
const USDT_CONTRACT = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // USDT (Polygon)

const POLYGONSCAN_API = `https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=${USDT_CONTRACT}&address=${CONTRACT_ADDRESS}&startblock=0&endblock=99999999&sort=asc&apikey=${API_KEY}`;

async function fetchUSDTTransactions() {
    try {
        const response = await fetch(POLYGONSCAN_API);
        const data = await response.json();

        if (data.status !== "1") {
            console.error("❌ Ошибка API:", data.message);
            return;
        }

        const transactions = data.result;
        console.log(`🔹 Всего найдено ${transactions.length} USDT-транзакций`);

        let incomingTxs = new Map(); // Храним всех, кто отправил средства в контракт
        let outgoingTxs = new Set(); // Храним всех, кто получил USDT из контракта

        transactions.forEach(tx => {
            const valueUSDT = parseFloat(tx.value) / 1e6; // USDT с учетом 6 десятичных знаков

            if (tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
                // 💰 Если средства отправлены в контракт → записываем
                incomingTxs.set(tx.from.toLowerCase(), {
                    from: tx.from,
                    txHash: tx.hash,
                    amount: valueUSDT
                });
            } else if (tx.from.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()) {
                // 💸 Если контракт отправил средства → записываем получателя
                outgoingTxs.add(tx.to.toLowerCase());
            }
        });

        console.log("\n🔎 **Поиск потерянных средств...**\n");

        let lostFunds = [];
        incomingTxs.forEach(({ from, txHash, amount }) => {
            if (!outgoingTxs.has(from.toLowerCase())) {
                lostFunds.push({ from, txHash, amount });
            }
        });

        if (lostFunds.length === 0) {
            console.log("✅ Все пользователи получили деньги обратно!");
        } else {
            console.log(`❌ Найдено ${lostFunds.length} пользователей, которым не вернули USDT:`);
            lostFunds.forEach(({ from, txHash, amount }, index) => {
                console.log(`🔹 ${index + 1}. Адрес: ${from} | TX: ${txHash} | Сумма: ${amount} USDT`);
            });
        }

    } catch (error) {
        console.error("❌ Ошибка при получении данных:", error);
    }
}

fetchUSDTTransactions();