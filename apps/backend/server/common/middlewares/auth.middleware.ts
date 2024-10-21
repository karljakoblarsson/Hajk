import { getSession } from "@auth/express";
import { authOptions } from "../auth/auth-options.ts";
import type { NextFunction, Request, Response } from "express";
import HttpStatusCodes from "../http-status-codes.ts";

export async function authenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (req.path.includes("auth")) {
    return next();
  }

  const session =
    res.locals.session ?? (await getSession(req, authOptions)) ?? undefined;

  res.locals.session = session;

  if (session) {
    return next();
  }

  return res.status(HttpStatusCodes.UNAUTHORIZED).send();
}

export async function currentSession(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const session = (await getSession(req, authOptions)) ?? undefined;
  res.locals.session = session;
  return next();
}
