import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

export type SessionPayload = {
  userId: number;
  email: string;
  name: string;
};

class SDKServer {
  private getSecret() {
    return new TextEncoder().encode(ENV.cookieSecret || "fallback-dev-secret");
  }

  async createSessionToken(
    userId: number,
    email: string,
    name: string,
    expiresInMs = ONE_YEAR_MS
  ): Promise<string> {
    const expiresAt = Math.floor((Date.now() + expiresInMs) / 1000);
    return new SignJWT({ userId, email, name })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expiresAt)
      .sign(this.getSecret());
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) return null;
    try {
      const { payload } = await jwtVerify(cookieValue, this.getSecret(), {
        algorithms: ["HS256"],
      });
      const { userId, email, name } = payload as Record<string, unknown>;
      if (typeof userId !== "number" || typeof email !== "string" || typeof name !== "string") return null;
      return { userId, email, name };
    } catch {
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = parseCookieHeader(req.headers.cookie || "");
    const sessionCookie = cookies[COOKIE_NAME];
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Sessão inválida");

    const user = await db.getUserById(session.userId);
    if (!user) throw ForbiddenError("Usuário não encontrado");

    await db.updateUserLastSignedIn(user.id);
    return user;
  }
}

export const sdk = new SDKServer();
