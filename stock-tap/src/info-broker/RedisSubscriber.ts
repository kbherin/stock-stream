import { createClient, RedisClient } from 'redis';
import { Server } from 'socket.io';
import { getLogger } from 'log4js';

import { StockLivePrice } from 'stock-evt-model/model/stock-price';
import { EVENT_APP_NOTIFY, EVENT_MARKET_NEWS, EVENT_PRICE_TAG } from 'stock-evt-model/constants/event-constants';

const redis_subscriber_host :string = process.env.REDIS_SUBSCRIBER_HOST || 'localhost';
const redis_subscriber_port :number = Number.parseInt(process.env.REDIS_SUBSCRIBER_PORT || '6379');
const redis_ops_host :string = process.env.REDIS_OPS_HOST || 'localhost';
const redis_ops_port :number = Number.parseInt(process.env.REDIS_OPS_PORT || '6379');

const logger = getLogger();

let subscriberRedisClient: RedisClient;
let opsRedisClient: RedisClient;

export function getSubscriberRedisClient() {
    if (subscriberRedisClient != null) {
        return subscriberRedisClient;
    }

    subscriberRedisClient = createClient({ host: redis_subscriber_host, port: redis_subscriber_port });
    subscriberRedisClient.on("error", function(error) {
        logger.error(error);
    });
    return subscriberRedisClient;
}

export function getOpsRedisClient() {
    if (opsRedisClient != null) {
        return opsRedisClient;
    }

    opsRedisClient = createClient({ host: redis_ops_host, port: redis_ops_port });
    opsRedisClient.on("error", function(error) {
        logger.error(error);
    });
    return opsRedisClient;
}

export function subscribeRedis(io : Server) {
    const redisClient = getSubscriberRedisClient();

    // Subscribe to price channel pattern. Typical patterns are - price:AAPL, price:TSLA
    redisClient.on('pmessage', (_, channel, message) => {
        logger.debug(channel, ':', message);
        if (channel.startsWith(EVENT_PRICE_TAG)) {
            const rec: StockLivePrice = JSON.parse(message);
            io.to(`${EVENT_PRICE_TAG}${rec.symbol}`).local.emit('price', rec);
        }
    });

    // Subscribe to market news and app notification channels
    redisClient.on('message', (channel, message) => {
        logger.debug(channel, ':', message);
        if (channel === EVENT_MARKET_NEWS) {
            io.local.emit(EVENT_MARKET_NEWS, message);
        } else if (channel === EVENT_APP_NOTIFY) { 
            io.local.emit(EVENT_APP_NOTIFY, message);
        }
    })
    // On subscribing to Redis channel
    .on("subscribe", function(channel, count) {
        logger.info(`Subscribed server to channel ${channel}. Subscribed to ${count} channels.`);
    })
    // On subscribing to Redis channel pattern
    .on("psubscribe", function(channel, count) {
        logger.info(`Psubscribed server to channel ${channel}. Subscribed to ${count} channels.`);
    });

    redisClient.psubscribe([`${EVENT_PRICE_TAG}*`]);
    redisClient.subscribe([EVENT_MARKET_NEWS, EVENT_APP_NOTIFY]);
}