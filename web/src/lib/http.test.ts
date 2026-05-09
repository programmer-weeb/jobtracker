import { describe, expect, it, vi } from "vitest";
import { http, configureHttpClient } from "./http";

describe("http utility", () => {
  it("request interceptor adds authorization header if token exists", () => {
    configureHttpClient({
      getToken: () => "test-token",
      onUnauthorized: vi.fn()
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reqHandlers = (http.interceptors.request as any).handlers;
    const fulfill = reqHandlers[0].fulfilled;

    const config = { headers: {} };
    const result = fulfill(config);

    expect(result.headers.Authorization).toBe("Bearer test-token");
  });

  it("request interceptor does not add authorization header if token is null", () => {
    configureHttpClient({
      getToken: () => null,
      onUnauthorized: vi.fn()
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reqHandlers = (http.interceptors.request as any).handlers;
    const fulfill = reqHandlers[0].fulfilled;

    const config = { headers: {} };
    const result = fulfill(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it("response interceptor rejects and calls onUnauthorized on 401", async () => {
    const onUnauthorized = vi.fn();
    configureHttpClient({
      getToken: () => null,
      onUnauthorized
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resHandlers = (http.interceptors.response as any).handlers;
    const reject = resHandlers[0].rejected;

    const error = { response: { status: 401 } };
    
    await expect(reject(error)).rejects.toEqual(error);
    expect(onUnauthorized).toHaveBeenCalled();
  });

  it("response interceptor rejects without calling onUnauthorized for non-401", async () => {
    const onUnauthorized = vi.fn();
    configureHttpClient({
      getToken: () => null,
      onUnauthorized
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resHandlers = (http.interceptors.response as any).handlers;
    const reject = resHandlers[0].rejected;

    const error = { response: { status: 500 } };
    
    await expect(reject(error)).rejects.toEqual(error);
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it("response interceptor passes success responses through", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resHandlers = (http.interceptors.response as any).handlers;
    const fulfill = resHandlers[0].fulfilled;

    const response = { data: "test" };
    expect(fulfill(response)).toEqual(response);
  });
});
