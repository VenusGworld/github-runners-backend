import * as yup from "yup";

export const newPasteSchema = yup.object({
  body: yup.object({
    title: yup
      .string()
      .typeError("Title must be a string")
      .required("Title is required"),
    scripts: yup
      .string()
      .typeError("Script must be a string")
      .required("Script is required"),
    description: yup
      .string()
      .typeError("Description must be a string")
      .required("Description is required"),
    gameLink: yup
      .string()
      .typeError("Game link must be a string")
      .required("Game link is required"),
  }),
});