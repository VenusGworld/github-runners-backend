import { errorResponse, throwError } from "../utils";

export const authenticate = async (req, res, next) => {
  try {
    return next();
  } catch (err) {
    return errorResponse({ res, err });
  }
};
