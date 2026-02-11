"""
Custom exception classes for the application.
Each exception includes a status code and default error name.
"""

class BaseCustomException(Exception):
    """Base exception class for all custom exceptions"""
    def __init__(self, detail: str, name: str = None):
        self.detail = detail
        self.name = name or self.__class__.__name__
        self.status_code = getattr(self.__class__, 'status_code', 500)
        super().__init__(self.detail)


class GenericException(BaseCustomException):
    """Generic server error - 500"""
    status_code = 500

    def __init__(self, detail: str = "Internal server error", name: str = "GenericException"):
        super().__init__(detail, name)


class DatabaseException(BaseCustomException):
    """Database operation error - 502"""
    status_code = 502

    def __init__(self, detail: str = "Database error occurred", name: str = "DatabaseException"):
        super().__init__(detail, name)


class NotAvailableException(BaseCustomException):
    """Resource not found - 404"""
    status_code = 404

    def __init__(self, detail: str = "Resource not found", name: str = "NotAvailableException"):
        super().__init__(detail, name)


class BadRequestException(BaseCustomException):
    """Bad request - 400"""
    status_code = 400

    def __init__(self, detail: str = "Bad request", name: str = "BadRequestException"):
        super().__init__(detail, name)


class AlreadyExistsException(BaseCustomException):
    """Resource already exists - 409"""
    status_code = 409

    def __init__(
        self,
        detail: str = "Resource already exists",
        name: str = "AlreadyExistsException"
    ):
        super().__init__(detail, name)


class TypeException(BaseCustomException):
    """Unsupported media type - 415"""
    status_code = 415

    def __init__(self, detail: str = "Unsupported media type", name: str = "TypeException"):
        super().__init__(detail, name)


class PermissionException(BaseCustomException):
    """Forbidden - insufficient permissions - 403"""
    status_code = 403

    def __init__(self, detail: str = "Insufficient permissions", name: str = "PermissionException"):
        super().__init__(detail, name)


class UnAuthorizedException(BaseCustomException):
    """Unauthorized - authentication required - 401"""
    status_code = 401

    def __init__(
        self,
        detail: str = "Authentication required",
        name: str = "UnAuthorizedException"
    ):
        super().__init__(detail, name)


class UnprocessableException(BaseCustomException):
    """Unprocessable entity - 422"""
    status_code = 422

    def __init__(self, detail: str = "Unprocessable entity", name: str = "UnprocessableException"):
        super().__init__(detail, name)


class MultiStatus(BaseCustomException):
    """Multi-status response - 207"""
    status_code = 207

    def __init__(self, detail: str = "Multi-status response", name: str = "MultiStatus"):
        super().__init__(detail, name)
