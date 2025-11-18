import type { NextFunction, Request, Response } from 'express';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import { errorHandler } from './error-handler.js';

/**
 * Unit tests for error handler middleware
 * Tests all error paths: ZodError, Error, and unknown errors
 */

describe('errorHandler', () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: NextFunction;
	let jsonSpy: ReturnType<typeof vi.fn>;
	let statusSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		// Reset mocks before each test
		jsonSpy = vi.fn();
		statusSpy = vi.fn().mockReturnValue({ json: jsonSpy });

		mockRequest = {
			path: '/test/path',
		};

		mockResponse = {
			status: statusSpy,
			json: jsonSpy,
		};

		mockNext = vi.fn();
	});

	describe('ZodError handling', () => {
		it('should handle ZodError with single validation issue', () => {
			// Arrange
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					received: 'number',
					path: ['field'],
					message: 'Expected string, received number',
				},
			]);

			// Act
			errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(400);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Validation error',
				details: {
					issues: [
						{
							path: 'field',
							message: 'Expected string, received number',
						},
					],
				},
			});
		});

		it('should handle ZodError with multiple validation issues', () => {
			// Arrange
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					received: 'number',
					path: ['field1'],
					message: 'Expected string, received number',
				},
				{
					code: 'too_small',
					minimum: 1,
					type: 'number',
					inclusive: true,
					exact: false,
					path: ['field2'],
					message: 'Number must be greater than or equal to 1',
				},
			]);

			// Act
			errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(400);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Validation error',
				details: {
					issues: [
						{
							path: 'field1',
							message: 'Expected string, received number',
						},
						{
							path: 'field2',
							message: 'Number must be greater than or equal to 1',
						},
					],
				},
			});
		});

		it('should handle ZodError with nested path', () => {
			// Arrange
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					received: 'undefined',
					path: ['user', 'address', 'street'],
					message: 'Required',
				},
			]);

			// Act
			errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(400);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Validation error',
				details: {
					issues: [
						{
							path: 'user.address.street',
							message: 'Required',
						},
					],
				},
			});
		});

		it('should handle ZodError with empty path', () => {
			// Arrange
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'object',
					received: 'null',
					path: [],
					message: 'Expected object, received null',
				},
			]);

			// Act
			errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(400);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Validation error',
				details: {
					issues: [
						{
							path: '',
							message: 'Expected object, received null',
						},
					],
				},
			});
		});
	});

	describe('Standard Error handling', () => {
		it('should handle standard Error with message', () => {
			// Arrange
			const error = new Error('Something went wrong');

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Something went wrong',
			});
		});

		it('should handle Error with empty message', () => {
			// Arrange
			const error = new Error('');

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: '',
			});
		});

		it('should handle custom Error subclass', () => {
			// Arrange
			class CustomError extends Error {
				constructor(message: string) {
					super(message);
					this.name = 'CustomError';
				}
			}
			const error = new CustomError('Custom error occurred');

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Custom error occurred',
			});
		});
	});

	describe('Unknown error handling', () => {
		it('should handle string error', () => {
			// Arrange
			const error = 'String error message';

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
			});
		});

		it('should handle number error', () => {
			// Arrange
			const error = 42;

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
			});
		});

		it('should handle null error', () => {
			// Arrange
			const error = null;

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
			});
		});

		it('should handle undefined error', () => {
			// Arrange
			const error = undefined;

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
			});
		});

		it('should handle object error', () => {
			// Arrange
			const error = { code: 'ERR_CUSTOM', details: 'Some details' };

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(statusSpy).toHaveBeenCalledWith(500);
			expect(jsonSpy).toHaveBeenCalledWith({
				success: false,
				error: 'Internal server error',
			});
		});
	});

	describe('Request path logging', () => {
		it('should log different request paths correctly', () => {
			// Arrange
			const error = new Error('Test error');
			const paths = ['/boards', '/boards/123/next', '/api/v1/users'];

			// Act & Assert - verify no errors with different paths
			for (const path of paths) {
				mockRequest.path = path;
				errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);
				expect(statusSpy).toHaveBeenCalledWith(500);
			}
		});
	});

	describe('Response behavior', () => {
		it('should not call next() for ZodError', () => {
			// Arrange
			const zodError = new ZodError([
				{
					code: 'invalid_type',
					expected: 'string',
					received: 'number',
					path: ['field'],
					message: 'Error',
				},
			]);

			// Act
			errorHandler(zodError, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should not call next() for Error', () => {
			// Arrange
			const error = new Error('Test error');

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(mockNext).not.toHaveBeenCalled();
		});

		it('should not call next() for unknown error', () => {
			// Arrange
			const error = 'Unknown error';

			// Act
			errorHandler(error, mockRequest as Request, mockResponse as Response, mockNext);

			// Assert
			expect(mockNext).not.toHaveBeenCalled();
		});
	});
});
