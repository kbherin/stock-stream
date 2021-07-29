import { createClient, RedisClient } from 'redis';

const host :string = process.env.REDIS_HOST || 'localhost';
const port :number = Number.parseInt(process.env.REDIS_PORT || '6379');
const redisClient: RedisClient = createClient(port, host);

export {redisClient};