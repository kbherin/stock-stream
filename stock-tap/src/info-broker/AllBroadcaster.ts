import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { subscribeRedis } from './RedisSubscriber';
import { StreamsSubscriber } from '../service/SubscriptionService';
import { parse as cookieParse } from 'cookie';
import { getLogger } from 'log4js';

const logger = getLogger();

export function publisher(http: HttpServer) {

    const io = new Server(http, {
        // Fall back to long polling if websocket is not available
        transports: [ "websocket", "polling" ],
        
        // Have to force use an older socketio protocol.
        // allowEIO3: false,

        // cors: {
        //     origin: "http://localhost:3000",
        //     methods: ["GET", "POST"]
        // }
    });

    // Subscribe to redis for information to consequently broadcast.
    subscribeRedis(io);

    io.on('connection', async (socket: Socket) => {
        logger.info(`Client ${socket.id} has connected`);

        const cookie = cookieParse(socket.request.headers.cookie || '');
        logger.info(cookie);
        
        const subscribeService = new StreamsSubscriber(socket);
        subscribeService.reSubscribePriceTickers(cookie.session || '', socket);

        subscribeService.appNotificationSubscribers();
        subscribeService.marketNewsSubscribers();
        subscribeService.initPriceSubscribers(cookie.session || '');
        
        socket.on('disconnect', () => {
            logger.info(`Client ${socket.id} disconnected`);
        });
    });

    // Socket middleware for user authorization.
    io.use((socket : Socket, next: Function) => {
        if (isAuthorized(socket.request)) {
            next();
        } else {
            next(new Error("invalid"));
        }
    });
}

function isAuthorized(request: any) {
    return true;
}