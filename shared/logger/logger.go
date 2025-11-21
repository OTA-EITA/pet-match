package logger

import (
	"context"
	"fmt"
	"os"
	"time"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

var (
	// globalLogger is the application-wide logger instance
	globalLogger *zap.Logger
	sugarLogger  *zap.SugaredLogger
)

// LogLevel represents log level
type LogLevel string

const (
	DebugLevel LogLevel = "debug"
	InfoLevel  LogLevel = "info"
	WarnLevel  LogLevel = "warn"
	ErrorLevel LogLevel = "error"
	FatalLevel LogLevel = "fatal"
)

// Config represents logger configuration
type Config struct {
	Level      LogLevel
	JSONFormat bool
	Service    string
}

// Initialize initializes the global logger
func Initialize(config Config) error {
	var zapConfig zap.Config

	if config.JSONFormat {
		// Production configuration - JSON format
		zapConfig = zap.NewProductionConfig()
	} else {
		// Development configuration - human-readable
		zapConfig = zap.NewDevelopmentConfig()
		zapConfig.EncoderConfig.EncodeLevel = zapcore.CapitalColorLevelEncoder
	}

	// Set log level
	switch config.Level {
	case DebugLevel:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.DebugLevel)
	case InfoLevel:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	case WarnLevel:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.WarnLevel)
	case ErrorLevel:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.ErrorLevel)
	case FatalLevel:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.FatalLevel)
	default:
		zapConfig.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	}

	// Add service name to all logs
	zapConfig.InitialFields = map[string]interface{}{
		"service": config.Service,
	}

	// Build logger
	var err error
	globalLogger, err = zapConfig.Build(zap.AddCallerSkip(1))
	if err != nil {
		return fmt.Errorf("failed to build logger: %w", err)
	}

	sugarLogger = globalLogger.Sugar()

	return nil
}

// Close closes the logger (flush any buffered logs)
func Close() error {
	if globalLogger != nil {
		return globalLogger.Sync()
	}
	return nil
}

// Debug logs a debug message
func Debug(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Debug(msg, fields...)
	}
}

// Info logs an info message
func Info(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Info(msg, fields...)
	}
}

// Warn logs a warning message
func Warn(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Warn(msg, fields...)
	}
}

// Error logs an error message
func Error(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Error(msg, fields...)
	}
}

// Fatal logs a fatal message and exits
func Fatal(msg string, fields ...zap.Field) {
	if globalLogger != nil {
		globalLogger.Fatal(msg, fields...)
	} else {
		fmt.Fprintf(os.Stderr, "FATAL: %s\n", msg)
		os.Exit(1)
	}
}

// With creates a child logger with additional fields
func With(fields ...zap.Field) *zap.Logger {
	if globalLogger != nil {
		return globalLogger.With(fields...)
	}
	return zap.NewNop()
}

// WithContext extracts logger from context or returns global logger
func WithContext(ctx context.Context) *zap.Logger {
	if logger, ok := ctx.Value(loggerKey).(*zap.Logger); ok && logger != nil {
		return logger
	}
	return globalLogger
}

// ContextWithLogger adds logger to context
func ContextWithLogger(ctx context.Context, logger *zap.Logger) context.Context {
	return context.WithValue(ctx, loggerKey, logger)
}

// Sugar returns a sugared logger for easier logging
func Sugar() *zap.SugaredLogger {
	return sugarLogger
}

type contextKey string

const loggerKey contextKey = "logger"

// RequestLog represents a structured HTTP request log
type RequestLog struct {
	Timestamp   time.Time     `json:"timestamp"`
	RequestID   string        `json:"request_id"`
	Method      string        `json:"method"`
	Path        string        `json:"path"`
	StatusCode  int           `json:"status_code"`
	Duration    time.Duration `json:"duration_ms"`
	UserID      string        `json:"user_id,omitempty"`
	IP          string        `json:"ip"`
	UserAgent   string        `json:"user_agent"`
	Error       string        `json:"error,omitempty"`
}

// LogRequest logs an HTTP request with structured fields
func LogRequest(req RequestLog) {
	fields := []zap.Field{
		zap.String("request_id", req.RequestID),
		zap.String("method", req.Method),
		zap.String("path", req.Path),
		zap.Int("status_code", req.StatusCode),
		zap.Duration("duration", req.Duration),
		zap.String("ip", req.IP),
		zap.String("user_agent", req.UserAgent),
	}

	if req.UserID != "" {
		fields = append(fields, zap.String("user_id", req.UserID))
	}

	if req.Error != "" {
		fields = append(fields, zap.String("error", req.Error))
		Error("Request failed", fields...)
	} else if req.StatusCode >= 500 {
		Error("Server error", fields...)
	} else if req.StatusCode >= 400 {
		Warn("Client error", fields...)
	} else {
		Info("Request completed", fields...)
	}
}

// DatabaseLog represents a structured database operation log
type DatabaseLog struct {
	Operation string        `json:"operation"`
	Table     string        `json:"table,omitempty"`
	Duration  time.Duration `json:"duration_ms"`
	Error     string        `json:"error,omitempty"`
}

// LogDatabase logs a database operation
func LogDatabase(log DatabaseLog) {
	fields := []zap.Field{
		zap.String("operation", log.Operation),
		zap.Duration("duration", log.Duration),
	}

	if log.Table != "" {
		fields = append(fields, zap.String("table", log.Table))
	}

	if log.Error != "" {
		fields = append(fields, zap.String("error", log.Error))
		Error("Database operation failed", fields...)
	} else if log.Duration > 100*time.Millisecond {
		Warn("Slow database operation", fields...)
	} else {
		Debug("Database operation completed", fields...)
	}
}

// String helper functions for common fields
func String(key, val string) zap.Field {
	return zap.String(key, val)
}

func Int(key string, val int) zap.Field {
	return zap.Int(key, val)
}

func Duration(key string, val time.Duration) zap.Field {
	return zap.Duration(key, val)
}

func Err(err error) zap.Field {
	return zap.Error(err)
}

func Any(key string, val interface{}) zap.Field {
	return zap.Any(key, val)
}
