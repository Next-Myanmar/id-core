import { GraphQLErrorCodes } from '@app/common/graphql';
import { status as gRpcStatus } from '@grpc/grpc-js';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { ThrottlerException } from '@nestjs/throttler';
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
      rpc: gRpcStatus.PERMISSION_DENIED,
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
  unknown: {
    key: 'exception.INTERNAL_SERVER_ERROR',
    codes: {
      http: HttpStatus.INTERNAL_SERVER_ERROR,
      graphql: GraphQLErrorCodes.INTERNAL_SERVER_ERROR,
      rpc: gRpcStatus.INTERNAL,
    },
  },
};

@Catch(I18nValidationException, UnauthorizedException, ThrottlerException)
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): any {
    if (exception instanceof I18nValidationException) {
      return this.handleValidationError(exception, host);
    }

    const errorDetail = ErrorDetails[exception.name];
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

        const response = exception.getResponse();
        response.message = message;
        response.code = code;

        delete response.error;

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
