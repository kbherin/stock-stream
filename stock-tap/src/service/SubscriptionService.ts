import { Socket } from "socket.io";
import { getLogger } from "log4js";
import { promisify } from "util";
import { getOpsRedisClient } from "../info-broker/RedisSubscriber";
import { EVENT_APP_NOTIFY, EVENT_MARKET_NEWS, EVENT_PRICE_TAG, EVENT_PRICE_SUBSCRIBE, SESSION_TAG }
    from "stock-evt-model/constants/event-constants";
import { RedisClient } from "redis";

const logger = getLogger();

export class StreamsSubscriber {
    
    socket: Socket;
    redisOpsClient: RedisClient;

    constructor(socket: Socket) {
        this.socket = socket;
        this.redisOpsClient = getOpsRedisClient();
    }

    /**
     * Access previously subscribed tickers for streaming prices stored against the Redis key 'session:$sessionid'.
     * @param sessionId
     */
    initPriceSubscribers(sessionId: string) :void {
        this.socket.on(EVENT_PRICE_SUBSCRIBE, (tickers:Array<string>) => {
            const tickerSet = new Set(tickers);
            this.redisOpsClient.hget(
                `${SESSION_TAG}${sessionId}`, EVENT_PRICE_SUBSCRIBE, (err, val) => {
                    if (err) {
                        logger.error(`Error in accessing ticker price subscriptions for ${SESSION_TAG} ${sessionId}`);
                        logger.error(err.message);
                        return;
                    }

                    const priceTickers :Set<string> = new Set((val || '').split(','));
                    let subs : Array<string> = [];
                    tickerSet.forEach((_, ticker, __) => {
                        if (!priceTickers.has(ticker)) {
                            this.socket.join(`${EVENT_PRICE_TAG}${ticker}`);
                            subs.push(ticker);
                        }
                    });
        
                    subs && logger.info(`Client ${this.socket.id} subscribed to price stream for: ${subs}`);
                    subs = [];
        
                    priceTickers.forEach((_, ticker, __) => {
                        if (!tickerSet.has(ticker)) {
                            this.socket.leave(`${EVENT_PRICE_TAG}${ticker}`);
                            subs.push(ticker);
                        }
                    });
        
                    subs.length && logger.info(`Client ${this.socket.id} unsubscribed from price stream for: ${subs}`);
        
                    this.savePriceSubscriptionsInCache(sessionId, tickers);
                });
                
            
        });
    }

    /**
     *  Adds tickers subscribed for streaming prices to the Redis key 'session:$sessionid' */
    savePriceSubscriptionsInCache(sessionId: string, tickers: Array<string>) :void {
        logger.info(`Saving tickers subscribed for ${sessionId}`)

        this.redisOpsClient.hset(`${SESSION_TAG}${sessionId}`, EVENT_PRICE_SUBSCRIBE, tickers.join(','),
            (err, _) => {
                if (err) {
                    logger.error(`Error in saving ticker price subscriptions for ${SESSION_TAG} ${sessionId}`);
                    logger.error(err.message);
                }
            })
    }


    /**
     * Subscribe to notification:app channel.
     */
    marketNewsSubscribers() :void {
        this.socket.join(EVENT_APP_NOTIFY);
    }

    /**
     * Subscribe to news:market channel.
     */
    appNotificationSubscribers() :void {
        this.socket.join(EVENT_MARKET_NEWS);
    }

    /**
     * Resubscribe to previously subscribed tickers for streaming prices. Useful against session interruption.
     * @param sessionId
     * @param socket 
     */
    reSubscribePriceTickers(sessionId: string, socket: Socket) :void {
        this.redisOpsClient.hget(`${SESSION_TAG}${sessionId}`, EVENT_PRICE_SUBSCRIBE, (err, channelsStr) => {
            if (err) {
                logger.error(err.message);
                return;
            }
            if (!channelsStr) {
                return;
            }
            const channels = channelsStr.split(',');
            channels.forEach(channel => socket.join(`${EVENT_PRICE_TAG}${channel}`));
            logger.info(`Reconnecting session '${sessionId.substr(0, 50)}***' subscribed to `, channels);
        });
    }
}