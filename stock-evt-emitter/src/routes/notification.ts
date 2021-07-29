import express, { Router, Request, Response } from 'express';
import { redisClient } from '../repo/redis-client';
import { getLogger } from 'log4js';

import { EVENT_APP_NOTIFY, EVENT_MARKET_NEWS } from 'stock-evt-model/constants/event-constants';

const logger = getLogger();

export const router: Router = express.Router();

redisClient.on("error", function(error) {
    logger.error(error);
});

router.post('/app-notification', (req: Request, res: Response) => {
    logger.info(`app-notification: ${JSON.stringify(req.body)}`);
    redisClient.publish(EVENT_APP_NOTIFY, JSON.stringify(req.body));
    res.sendStatus(200);
});

router.post('/market-news', (req: Request, res: Response) => {
    logger.info(`market-news: ${JSON.stringify(req.body)}`);
    redisClient.publish(EVENT_MARKET_NEWS, JSON.stringify(req.body));
    res.sendStatus(200);
});