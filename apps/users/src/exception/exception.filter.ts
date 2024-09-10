import {
  DEFAULT_I18N_FILTER_EXCEPTIONS,
  I18nExceptionFilter,
  PrismaErrorCodes,
} from '@app/common';
import {
  Catch,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../prisma/generated';

@Catch(Prisma.PrismaClientKnownRequestError, ...DEFAULT_I18N_FILTER_EXCEPTIONS)
export class ExceptionFilter extends I18nExceptionFilter {
  protected getException(exception: any): HttpException {
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        exception.code === PrismaErrorCodes.NOT_FOUND ||
        exception.code === PrismaErrorCodes.INVALID_COLUMN_DATA
      ) {
        return new NotFoundException();
      }

      this.logger.warn(exception);

      return new InternalServerErrorException();
    }

    return super.getException(exception);
  }
}
