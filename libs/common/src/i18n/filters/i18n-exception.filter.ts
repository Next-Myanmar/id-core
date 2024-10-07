import { PrismaErrorCodes } from '@app/common/database';
import { GraphQLErrorCodes } from '@app/common/graphql';
import { status as gRpcStatus } from '@grpc/grpc-js';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { I18nContext } from 'nestjs-i18n';
import { throwError } from 'rxjs';
import { I18nValidationException } from '../exceptions';
import { formatI18nErrors } from '../utils';

const ErrorDetails = {
  UnauthorizedException: {
    key: 'exception.UNAUTHENTICATED',
    codes: {
      http: HttpStatus.UNAUTHORIZED,
      graphql: GraphQLErrorCodes.UNAUTHENTICATED,
      rpc: gRpcStatus.UNAUTHENTICATED,
    },
  },
  ForbiddenException: {
    key: 'exception.FORBIDDEN',
    codes: {
      http: HttpStatus.FORBIDDEN,
      graphql: GraphQLErrorCodes.FORBIDDEN,
      rpc: gRpcStatus.PERMISSION_DENIED,
    },
  },
  NotFoundException: {
    key: 'exception.NOT_FOUND',
    codes: {
      http: HttpStatus.NOT_FOUND,
      graphql: GraphQLErrorCodes.NOT_FOUND,
      rpc: gRpcStatus.NOT_FOUND,
    },
  },
  ThrottlerException: {
    key: 'exception.TOO_MANY_REQUESTS',
    codes: {
      http: HttpStatus.TOO_MANY_REQUESTS,
      graphql: GraphQLErrorCodes.TOO_MANY_REQUESTS,
      rpc: gRpcStatus.RESOURCE_EXHAUSTED,
    },
  },
  InternalServerErrorException: {
    key: 'exception.INTERNAL_SERVER_ERROR',
    codes: {
      http: HttpStatus.INTERNAL_SERVER_ERROR,
      graphql: GraphQLErrorCodes.INTERNAL_SERVER_ERROR,
      rpc: gRpcStatus.INTERNAL,
    },
  },
};

@Catch()
export class I18nExceptionFilter implements ExceptionFilter {
  protected readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): any {
    if (exception.name === 'I18nValidationException') {
      return this.handleValidationError(exception, host);
    }

    let exceptionName: string;
    if (
      exception.name === 'PrismaClientKnownRequestError' ||
      exception.name === 'PrismaClientValidationError'
    ) {
      if (
        exception.code === PrismaErrorCodes.NOT_FOUND ||
        exception.code === PrismaErrorCodes.INVALID_COLUMN_DATA
      ) {
        exceptionName = NotFoundException.name;
      } else {
        this.logger.warn(`Prisma Error: ${exception}`);

        exceptionName = InternalServerErrorException.name;
      }
    } else {
      exceptionName = this.getException(exception).name;
    }

    let errorDetail = ErrorDetails[exceptionName];

    if (errorDetail) {
      this.logger.debug(`Error: ${exception}`);
    } else {
      errorDetail = ErrorDetails.InternalServerErrorException;
      this.logger.warn(`Error: ${exception}`);
    }

    const translateKey = errorDetail.key;

    const i18nContext = I18nContext.current();

    const message: string = i18nContext.t(translateKey, {
      lang: i18nContext.lang,
    });

    const hostType: string = host.getType();

    const code = errorDetail.codes[hostType];

    switch (hostType) {
      case 'http': {
        const httpResponse = host.switchToHttp().getResponse();
        const responseBody = {
          statusCode: code,
          message,
        };

        httpResponse.status(code).send(responseBody);
        break;
      }
      case 'graphql': {
        exception.message = message;

        try {
          const response = exception.getResponse();
          response.message = message;
          response.code = code;

          delete response.error;
        } catch {}

        return exception;
      }
      case 'rpc': {
        if (host.getArgByIndex(1) instanceof RmqContext) {
          const context: RmqContext = host.getArgByIndex(1);
          this.logger.warn(
            {
              event: context.getArgByIndex(2),
              details: message,
            },
            'Validation error occured',
          );
        }
        return throwError(() => ({
          code,
          message,
        }));
      }
      default:
        throw new Error('Unexpected host type: ' + hostType);
    }
  }

  protected getException(exception: any): HttpException {
    return exception;
  }

  private handleValidationError(
    exception: I18nValidationException,
    host: ArgumentsHost,
  ): any {
    const i18nContext = I18nContext.current();

    const response = exception.getResponse() as any;

    const errorMessages = response.message || [];

    const formattedMessages = formatI18nErrors(
      errorMessages,
      i18nContext.service,
      { lang: i18nContext.lang },
    );

    const message = i18nContext.t('exception.BAD_REQUEST', {
      lang: i18nContext.lang,
    });

    const hostType: string = host.getType();

    this.logger.debug(
      `Validation Errors: ${JSON.stringify(formattedMessages)}`,
    );

    switch (hostType) {
      case 'http': {
        const httpResponse = host.switchToHttp().getResponse();
        const responseBody = {
          statusCode: HttpStatus.BAD_REQUEST,
          message,
          details: formattedMessages,
        };

        httpResponse.status(HttpStatus.BAD_REQUEST).send(responseBody);
        break;
      }
      case 'graphql': {
        exception.message = message;
        response.message = message;
        response.code = GraphQLErrorCodes.BAD_USER_INPUT;

        response.details = formattedMessages;

        delete response.error;

        return exception;
      }
      case 'rpc': {
        if (host.getArgByIndex(1) instanceof RmqContext) {
          const context: RmqContext = host.getArgByIndex(1);
          this.logger.warn(
            {
              event: context.getArgByIndex(2),
              details: formattedMessages,
            },
            'Validation error occured',
          );
        }
        return throwError(() => ({
          code: gRpcStatus.INVALID_ARGUMENT,
          message: JSON.stringify(formattedMessages),
        }));
      }
      default:
        throw new Error('Unexpected host type: ' + hostType);
    }
  }
}
