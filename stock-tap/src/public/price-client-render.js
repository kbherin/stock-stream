//const newWatcher = require('./prices-watcher');

let clientNum = 0;
let socketRepo = [];

function addPriceWatcher(clientNum, clientRoot) {
    //= 'price-clients';

    const instrPrices = {
        GOOG: {symbol: "GOOG", currentPrice: 34.56}
    };
    const socket = newPricesWatcher(clientNum, 'instrument-prices', instrPrices, renderPriceChart);
    socketRepo[clientNum] = socket;

    function PriceRow(props) {
        return (
            <tr>
                <td>{props.value.symbol}</td>
                <td>{props.value.currentPrice}</td>
                <td onClick={() => {
                    socket.emit('price:subscribe', Object.keys(instrPrices).filter(k => k !== props.value.symbol));
                    delete instrPrices[props.value.symbol];
                    renderPriceChart();
                }}>x</td>
            </tr>);
    }

    function PriceList(props) {
        let priceItems = _.sortBy(Object.values(props['instr-prices']), 'symbol')
            .map((rec) => <PriceRow key={rec.symbol} value={rec} />);

        return (
            <tbody>
                {priceItems}
            </tbody>);
    }

    function renderPriceChart() {
        const PriceClient = (
            <div>
                <table>
                    <thead>
                        <tr>
                            <td>Ticker</td>
                            <td>Price</td>
                            <td></td>
                        </tr>
                    </thead>
                    
                    <PriceList instr-prices={instrPrices} /> 
                </table>
            </div>);
        ReactDOM.render(
            PriceClient,
            clientRoot
        );
    }

    function tickersSample(n) {
        return _.slice(_.shuffle(tickers), 0, n);
    }

    tickersSample(200).forEach(symbol => instrPrices[symbol] = {symbol});
    socket.emit('price:subscribe', Object.keys(instrPrices));

    renderPriceChart();
}

function addPriceClient(clientNum) {
    let slot = document.createElement('div');
    slot.setAttribute('id', `price-client${clientNum}`);
    slot.setAttribute('class', 'price-client');
    slot.appendChild(document.createTextNode(`Client ${clientNum}`));
    document.getElementById('price-clients').appendChild(slot);
    return slot;
}

function addPriceCard() {
    addPriceWatcher(clientNum, addPriceClient(clientNum));
    clientNum++;
}