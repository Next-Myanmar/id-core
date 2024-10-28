import { HttpException, HttpStatus } from '@nestjs/common';

export class CorsDeniedException extends HttpException {
  constructor(public origin: string, public clientId?: string) {
    super('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR);
    this.name = 'CorsDeniedException';
  }
}
