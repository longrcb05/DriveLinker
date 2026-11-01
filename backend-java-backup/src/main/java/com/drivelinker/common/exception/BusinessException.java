package com.drivelinker.common.exception;

import lombok.Getter;

/**
 * Exception tùy chỉnh dùng cho các lỗi liên quan đến nghiệp vụ (Business Logic).
 */
@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public BusinessException(ErrorCode errorCode, String customMessage) {
        super(customMessage);
        this.errorCode = errorCode;
    }
}
