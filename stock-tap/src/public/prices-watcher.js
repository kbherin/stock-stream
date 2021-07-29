
function newPricesWatcher(clientNum, channelName, instrPrices, renderPriceChart) {

    // Initiate the connection to the server
    const socket = io('http://localhost:3000');

    socket.io.on('reconnect', () => console.debug("Reconnected to streams server"));
    socket.io.on('reconnect_attempt', () => console.debug("Reconnecting to streams server"));
    socket.on('disconnect', () => console.warn("Disconnected from streams server"));
    socket.on('connect_error', () => console.error("Could not connect to streams server"));
    
    socket.on('notification:app', (notification) => console.log(`Note: ${notification}`));
    socket.on('news:market', (news) => console.log(`News: ${news}`));
    socket.on('price', (priceRec) => {
        instrPrices[priceRec.symbol] = priceRec;
        renderPriceChart();
    });

    function subscrList1() {
        socket.emit('price:subscribe', ['AAPL', 'TSLA']);
    }
    function subscrList2() {
        socket.emit('price:subscribe', ['MSFT', 'TSLA']);
    }

    return socket;
}