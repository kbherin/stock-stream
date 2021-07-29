import express, { Router, Request, Response } from 'express';
import { redisClient } from '../repo/redis-client';
import { getLogger } from 'log4js';

import { StockLivePrice } from 'stock-evt-model/model/stock-price';
import { EVENT_PRICE_TAG } from 'stock-evt-model/constants/event-constants';

const logger = getLogger();

export const router: Router = express.Router();


redisClient.on("error", function(error) {
    logger.error(error);
});

router.post('/live-price', (req: Request, res: Response) => {
    logger.info(`live-price: ${JSON.stringify(req.body)}`);
    const symPrice :StockLivePrice = req.body;

    redisClient.publish(`${EVENT_PRICE_TAG}${symPrice.symbol}`, JSON.stringify(symPrice));
    res.sendStatus(200);
});