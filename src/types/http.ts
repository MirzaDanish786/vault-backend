export type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface MetaData {
  [key: string]: string | number | unknown | undefined;
}
