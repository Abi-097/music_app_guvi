import serverless from 'serverless-http';
import app from '../../server/src/app.js';

const handler = serverless(app);

export const handlerFn = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false; // keep Mongo connection warm
  return handler(event, context);
};

export { handlerFn as handler };
