declare namespace Express {
  interface Request {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    authContext?: import('../auth/auth.types.js').ResolvedAuthContext;
  }
}
