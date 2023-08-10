import { RouteModule } from "../RouteModuleClass";
import { 
  newPasteController,
} from "./controllers";

import {
  newPasteSchema,
} from "./schema";

class RunnerModule extends RouteModule {
  publicRoutes() {
    // // fetch a paste.
    // this.router.get(
    //   "/fetchpaste/:id",
    //   fetchPasteController
    // );
    
  }
  privateRoutes() {
    // insert a new paste.
    this.router.post(
      "/newpaste",
      this.validateSchema(newPasteSchema, { includeQuery: true }),
      newPasteController
    );
  }
}

export const runnerModule = new RunnerModule();