// Typed wrapper around k6/http.
// Prepends config.baseUrl, merges headers, and applies metric tags.
//
// Usage:
//   import { get, post } from '../lib/http';
//   const res = get('/todos', { tags: { name: 'getTodos' } });

import http, { RefinedResponse, ResponseType, Params } from 'k6/http';
import { config } from '../config/environments';

export interface RequestOptions {
  headers?: Record<string, string>;
  // Tag requests with { name: 'endpointLabel' } to create per-endpoint threshold rules.
  tags?: Record<string, string>;
  // Optional Bearer token — added as Authorization: Bearer <token>.
  token?: string;
  // Override k6's response callback to mark non-2xx responses as expected.
  // Use for negative tests so intentional error responses don't inflate http_req_failed.
  // Must use http.expectedStatuses() — plain functions are NOT accepted by k6.
  // Example: responseCallback: http.expectedStatuses(400)
  responseCallback?: Params['responseCallback'];
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    ...options.headers,
  };
}

export function get(
  path: string,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.get(`${config.baseUrl}${path}`, {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}

export function post(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.post(`${config.baseUrl}${path}`, JSON.stringify(body), {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}

export function put(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.put(`${config.baseUrl}${path}`, JSON.stringify(body), {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}

export function patch(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.patch(`${config.baseUrl}${path}`, JSON.stringify(body), {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}

export function del(
  path: string,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.del(`${config.baseUrl}${path}`, null, {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}

// Use when the DELETE endpoint requires a JSON request body (e.g. bulk delete).
// The plain `del` wrapper always sends a null body; this variant serialises `body` to JSON.
export function delWithBody(
  path: string,
  body: unknown,
  options: RequestOptions = {}
): RefinedResponse<ResponseType | undefined> {
  return http.del(`${config.baseUrl}${path}`, JSON.stringify(body), {
    headers: buildHeaders(options),
    tags: options.tags,
    responseCallback: options.responseCallback,
  });
}
