import type { Request, Response, NextFunction } from "express";
import aj from "../config/arcject.js";
import { ArcjetNodeRequest, slidingWindow } from "@arcjet/node";

const securityMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_EN === "test") return next();

  try {
    const role: RateLimitRole = req.user?.role ?? "guest";

    let limit: number;
    let message: string;

    switch (role) {
      case "admin":
        limit = 20;
        message = "Admin request limit exceeded (20 per minute) Slow down...";
      case "teacher":
      case "student":
        limit = 10;
        message = "Admin request limit exceeded (10 per minute) Please wait...";
      default:
        limit = 5;
        message =
          "Guest request limit exceeded (5 per minute) Please sign up for higher limits...";
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      }),
    );

    const arcjectRequest: ArcjetNodeRequest = {
      headers: req.headers,
      method: req.method,
      url: req.originalUrl ?? req.url,
      socket: {
        remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0",
      },
    };

    const decision = await client.protect(arcjectRequest);

    if (decision.isDenied() && decision.reason.isBot()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Automated requests are nore allowed",
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Rquest blocked by security policy",
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      return res.status(403).json({
        error: "Too many request",
        message: message,
      });
    }

    next();
  } catch (error) {
    console.error("Arcject middleware erro:", error);
    res.status(500).json({
      error: "Internal error",
      meesage: "Something went wrong with security middleware",
    });
  }
};

export default securityMiddleware;
