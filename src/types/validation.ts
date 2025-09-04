import { Card as FSRSCard } from 'ts-fsrs'

export enum ValidationErrorType {
    NON_STRING_FIELD_TYPE = 'NON_STRING_FIELD_TYPE',
    MALFORMED_ENTRY = 'MALFORMED_ENTRY',
    UNKNOWN_FIELD = 'UNKNOWN_FIELD',
    MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
    INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT',
    NON_NUMERIC_VALUE = 'NON_NUMERIC_VALUE',
    INVALID_VALUE_BOUNDS = 'INVALID_VALUE_BOUNDS',
    FLOAT_VALUE_NOT_ALLOWED = 'FLOAT_VALUE_NOT_ALLOWED',
    INVALID_STATE_VALUE = 'INVALID_STATE_VALUE',
    FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
    ALGORITHM_ERROR = 'ALGORITHM_ERROR',
}

export interface ValidationError {
    filePath?: string
    type: ValidationErrorType
    field?: string
    value?: unknown
    message?: string
    suggestion?: string
}

export interface ValidationResult {
    errors: ValidationError[]
    card?: FSRSCard
}
