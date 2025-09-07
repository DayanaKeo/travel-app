export type RouteCtx<P extends Record<string, string>> = { params: Promise<P> };
