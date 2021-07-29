import express from 'express';
import { Request, Response } from 'express';
import { createServer } from "http";
// import { StatusCodes } from 'http-status-codes';
import { join } from 'path';
import { router as notificationRouter } from './routes/notification';
import { router as pricingRouter } from './routes/pricing';
import { getLogger, levels } from 'log4js';

const logger = getLogger();
logger.level = levels.INFO.levelStr;

const port :number = Number.parseInt(process.env.PORT || '4000');
const app = express();
// const http = createServer(app);
const http = createServer(app);

// Some application middlewares
// Serve static
const staticFilesPath = join(__dirname, '..', 'public')
app.use(express.static(staticFilesPath));
// Parse json
app.use(express.json());
// URL encoding
app.use(express.urlencoded({extended: true}));

// Logger middleware. Log time of request
app.use(function timelog(req: Request, res: Response, next: Function) {
    logger.debug(`Called ${req.path}`);
    next();
});

app.use('/notification', notificationRouter);
app.use('/pricing', pricingRouter);


http.listen(port, () => {
    logger.info(`Listening for manual notifications on port ${port}`);
});