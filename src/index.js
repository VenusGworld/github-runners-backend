import express from "express";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import session from "express-session";
import cors from "cors";
import { PrivyClient } from '@privy-io/server-auth';

import {
  runnerModule,
} from "./modules";

import NodeCache from "node-cache";
import CronManager from "./cronManager";

class Server {
  constructor({ port }) {
    this.express = express();
    this.express.set("port", port);
    this.server = require("http").createServer(this.express);
    this.io = require("socket.io")(this.server, {
      cors: {
        origins: "*:*",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.start();
    return this.server;
  }
  async start() {
    this.connectDatabase();
    // socketService(this.io);
    this.initSessions();
    this.initCache();
    this.initMiddleware();
    this.forceSecure();
    this.insertHelpers();
    this.cronManager = new CronManager(this.io);
    this.publicRoot = path.join("public");
    this.express.use(express.static(this.publicRoot));
    this.initPublicRoutes();
    this.initPrivateRoutes();
    this.express.use("/*", (req, res) => {
      res.sendFile("index.html", { root: this.publicRoot });
    });
    this.initErrorHandler();
    this.initErrorRoute();
    this.initPrivyClient();
  }
  async connectDatabase() {
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      autoIndex: true,
    }).then(() => console.log('connected to DB')).catch((err) => console.log("ERROR: ", err));
    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", () => {
      console.log("DB has been connected");
    });
  }
  initSessions() {
    const opts = {};
    if (process.env.PRODUCTION == "true") {
      opts.cookie = {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 1000 * 60 * 60 * 48,
      };
    } else {
      opts.cookie = {
        maxAge: 1000 * 60 * 60 * 48,
      };
    }
    this.express.use(
      session({
        ...opts,
        saveUninitialized: false,
        resave: true,
        name: "solaritySession",
        secret: process.env.SESSION_SECRET,
        store: MongoStore.create({
          mongoUrl: process.env.MONGO_URL,
        }),
      })
    );
  }
  initPublicRoutes() {
    // put here the public routes
  }
  initPrivateRoutes() {
    // put here the private routes
    console.log("> Starting private routes");
    this.express.use("/api/runners", runnerModule);
    this.express.use("/api/*", (req, res, next) => {
      const err = new Error("Not Found");
      err.status = 404;
      next(err);
    });
  }
  initMiddleware() {
    // middleware initialization
    this.express.use(helmet());
    this.express.set("trust proxy", 1);
    const corsOptions = {
      origin: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: true, //access-control-allow-credentials:true
      optionSuccessStatus: 200,
    };
    this.express.use(cors(corsOptions));

    this.express.use(express.json());
    this.express.use(express.urlencoded({ extended: false }));
    this.express.use(cookieParser());
  }
  forceSecure() {
    // force to https on production
    this.express.enable("trust proxy");
    this.express.use((req, res, next) => {
      if (process.env.NODE_ENV == "production" && !req.secure) {
        return res.redirect("https://" + req.headers.host + req.url);
      }
      next();
    });
  }
  initCache() {
    const registerNonceCache = new NodeCache({
      useClones: false,
      stdTTL: 3600,
    });
    this.express.set("registerNonceCache", registerNonceCache);
  }
  initErrorRoute() {
    this.express.use((req, res, next) => {
      const err = new Error("Not Found");
      err.status = 404;
      next(err);
    });
    this.express.use((err, req, res, next) => {
      res.status(err.status || 500);
      res.locals.error = err;
      res.locals.errorDescription = err.message;
      if (global.rollbar) {
        global.rollbar.error(err);
      }
      return res.send("ERROR: NOT FOUND");
    });
  }
  initPrivyClient() {
    return new PrivyClient(process.env.PRIVY_APP_ID, process.env.PRIVY_APP_SECRET);
  }
  initErrorHandler() {
    this.express.use(async (err, req, res, next) => {
      return next(err);
    });
  }
  insertHelpers() {
    this.express.use((req, res, next) => {
      req.profile = async () => getProfileData(req);
      next();
    });
  }
}

export default Server;