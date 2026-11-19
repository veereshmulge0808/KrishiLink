/**
 * API client configuration and network wrapper
 * Allows swapping between mock implementation and live FastAPI backend
 * via VITE_API_BASE_URL.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws';

export interface ApiResponse<T> {
  data: T;
  status: number;
}

export class ApiError extends Error {
  public code: string;
  public details?: any;

  constructor(code: string, message: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.details = details;
  }
}

// Simulates network latency
export const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));
