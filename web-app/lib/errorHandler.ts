import { logger } from './logger';
import axios, { AxiosError } from 'axios';

export interface AppError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

export class ApiError extends Error implements AppError {
  code?: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, statusCode?: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  details?: any;

  constructor(message: string, details?: any) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;

  constructor(message: string = '認証が必要です') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;

  constructor(message: string = 'この操作を実行する権限がありません') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND';
  statusCode = 404;

  constructor(message: string = 'リソースが見つかりません') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export function handleApiError(error: unknown): AppError {
  // Axios error
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;
    const statusCode = axiosError.response?.status;
    const message = axiosError.response?.data?.error || axiosError.message;
    const code = axiosError.response?.data?.code || axiosError.code;
    const details = axiosError.response?.data;

    logger.apiError(
      axiosError.config?.method?.toUpperCase() || 'UNKNOWN',
      axiosError.config?.url || 'UNKNOWN',
      error
    );

    // ステータスコードに応じたエラーを返す
    switch (statusCode) {
      case 401:
        return new AuthenticationError(message);
      case 403:
        return new AuthorizationError(message);
      case 404:
        return new NotFoundError(message);
      case 400:
        return new ValidationError(message, details);
      default:
        return new ApiError(message, statusCode, code, details);
    }
  }

  // カスタムエラー
  if (error instanceof ApiError ||
      error instanceof ValidationError ||
      error instanceof AuthenticationError ||
      error instanceof AuthorizationError ||
      error instanceof NotFoundError) {
    return error;
  }

  // 通常のErrorオブジェクト
  if (error instanceof Error) {
    logger.error('Unexpected error', error);
    return new ApiError(error.message);
  }

  // その他
  logger.error('Unknown error', error);
  return new ApiError('予期しないエラーが発生しました');
}

export function getUserFriendlyMessage(error: AppError): string {
  // ユーザーフレンドリーなメッセージに変換
  const errorMessages: Record<string, string> = {
    'Network Error': 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
    'timeout': 'リクエストがタイムアウトしました。もう一度お試しください。',
    'ECONNABORTED': '接続がタイムアウトしました。もう一度お試しください。',
  };

  return errorMessages[error.message] || error.message;
}
