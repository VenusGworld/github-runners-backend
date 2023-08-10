import {
  successResponse,
  errorResponse,
} from "../../../utils";
import PasteModel from "../model";

export const newPasteController = async (req, res) => {
  try {
    const {
      body: { title, scripts, description, gameLink },
    } = req;
    const paste = await PasteModel.create({
      title, scripts, description, gameLink
    });

    paste.save();
    
    return successResponse({ res, response: {  } });
  } catch (err) {
    return errorResponse({ res, err });
  }
};
