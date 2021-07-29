import express from 'express';
import { Request, Response } from 'express';
import { createServer } from "http";
// import { StatusCodes } from 'http-status-codes';
import { join } from 'path';
import { publisher } from './info-broker/AllBroadcaster';
import { getLogger, levels } from 'log4js';

const port = process.env.PORT || 3000;
const app = express();
// const http = createServer(app);
const http = createServer(app);

const logger = getLogger();
logger.level = levels.INFO.levelStr;

// Some application middlewares
// Serve static
const staticFilesPath = join(__dirname, 'public');
app.use(express.static(staticFilesPath));
// Parse json
app.use(express.json());
// URL encoding
app.use(express.urlencoded({extended: true}));

// Logger middleware. Log time of request
app.use(function timelog(req: Request, res: Response, next: Function) {
    logger.info(`Called ${req.path}`);
    next();
});

publisher(http);

http.listen(port, () => {
    logger.info(`Listening for subscribers on port ${port}`);
});