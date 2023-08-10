import { errorResponse, throwError } from "../utils";
import { PrivyClient } from '@privy-io/server-auth';

export const authenticate = async (req, res, next) => {
  try {
    // const authToken = await (req.headers.authorization).replace('Bearer ', '');
    // const privy = new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
    // await privy.verifyAuthToken(authToken);
    return next();
  } catch (err) {
    return errorResponse({ res, err });
  }
};
