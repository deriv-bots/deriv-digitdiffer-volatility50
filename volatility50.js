const WebSocket = require('ws');
const chalk = require('chalk').default;
const notifier = require('node-notifier');

const token = 'VDtqv0OoOH7bMNV'; // ✅ Updated API key
const app_id = 1089;
let ws = new WebSocket(`wss://ws.binaryws.com/websockets/v3?app_id=${app_id}`);

let tickHistory = [];
let stake = 500;  // ✅ Initial stake in USD
let tradePlaced = false;

ws.onopen = () => {
    console.log(chalk.green.bold("✅ Connected to Deriv WebSocket"));
    ws.send(JSON.stringify({ authorize: token }));
};

ws.onmessage = (message) => {
    const data = JSON.parse(message.data);

    if (data.msg_type === 'authorize') {
        console.log(chalk.cyan.bold("✅ Authorized"));
        ws.send(JSON.stringify({ ticks: "R_50", subscribe: 1 })); // ✅ Changed market to Volatility 50
    }

    if (data.msg_type === 'tick') {
        const price = data.tick.quote;
        const formattedPrice = price.toFixed(4); // ✅ Adjusted for 4 decimal places
        const decimalPart = formattedPrice.split('.')[1] || "0000";
        const lastDigit = parseInt(decimalPart.length > 3 ? decimalPart[3] : decimalPart[decimalPart.length - 1]);

        console.log(chalk.yellow(`Tick: ${formattedPrice} | Last Digit: ${lastDigit}`));

        tickHistory.push(lastDigit);
        if (tickHistory.length > 6) tickHistory.shift(); // ✅ Keep last 6 digits

        const uniqueDigit = tickHistory[0];

        if (!tradePlaced && tickHistory.length === 6 && tickHistory.every(d => d === uniqueDigit)) {
            console.log(chalk.magenta.bold(`🎯 Six ${uniqueDigit}s in a row! Placing DIGITDIFF trade on the 7th tick!`));

            ws.send(JSON.stringify({
                buy: 1,
                price: stake,
                parameters: {
                    amount: stake,
                    basis: "stake",
                    contract_type: "DIGITDIFF",
                    currency: "USD",
                    duration: 1,
                    duration_unit: "t",
                    symbol: "R_50", // ✅ Updated for Volatility 50
                    barrier: uniqueDigit
                }
            }));

            // ✅ System Notification Alert
            notifier.notify({
                title: 'Trade Alert!',
                message: `A DIGITDIFF trade was placed using barrier ${uniqueDigit} and stake ${stake} USD`,
                sound: true
            });

            tradePlaced = true; // ✅ Stops further execution after first trade
            ws.close(); // ✅ Closes WebSocket immediately after trade
            console.log(chalk.red.bold("🔴 Trading session completed. WebSocket closed."));
        }
    }
};