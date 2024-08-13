import { status as RpcStatus } from '@grpc/grpc-js';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { throwError } from 'rxjs';
import { I18nValidationException } from '../exceptions';
import { formatI18nErrors } from '../utils';

@Catch(I18nValidationException)
export class I18nExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(I18nExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost): any {
    if (exception instanceof I18nValidationException) {
      return this.handleValidationError(exception, host);
    }

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

    switch (hostType) {
      case 'http': {
        const httpResponse = host.switchToHttp().getResponse();
        const responseBody = {
          statusCode: exception.getStatus(),
          message,
          details: formattedMessages,
        };

        httpResponse.status(exception.getStatus()).send(responseBody);
        break;
      }
      case 'graphql': {
        return exception;
      }
      case 'rpc': {
        return throwError(() => ({
          code: RpcStatus.INVALID_ARGUMENT,
          message: JSON.stringify(formattedMessages),
        }));
      }
      default:
        throw new Error('Unexpected host type: ' + hostType);
    }
  }
}
