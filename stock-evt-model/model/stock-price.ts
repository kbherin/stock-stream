interface StockLivePrice {
    symbol: string,
    currentPrice: number,
    timestamp: Date
}

interface StockHistoricalPrice {
    symbol: string,
    price: number,
    priceDate: Date
}

export {StockHistoricalPrice, StockLivePrice};