import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { RmqContext } from '@nestjs/microservices';
import { I18nResolver, I18nResolverOptions } from 'nestjs-i18n';

/**
 * Resolves the language from the request headers.
 */
@Injectable()
export class HeaderResolver implements I18nResolver {
  private logger = new Logger('I18nService');

  /**
   * The keys of the request headers to search for the language.
   */
  constructor(
    @I18nResolverOptions()
    private keys: string[] = [],
  ) {}

  /**
   * Resolves the language from the request headers.
   *
   * @param {ExecutionContext} context - The execution context.
   * @return {string | undefined} The language or undefined if not found.
   */
  resolve(context: ExecutionContext): string | undefined {
    const req = this.getRequestFromContext(context);
    return this.extractLanguageFromHeaders(req);
  }

  /**
   * Gets the request object from the execution context.
   *
   * @param {ExecutionContext} context - The execution context.
   * @return {any} The request object.
   */
  private getRequestFromContext(context: ExecutionContext): any {
    const hostType: string = context.getType();

    switch (hostType) {
      case 'http':
        return context.switchToHttp().getRequest();
      case 'graphql':
        return this.getGraphQLRequest(context);
      case 'rpc':
        return this.getRpcRequest(context);
      default:
        return undefined;
    }
  }

  /**
   * Gets the GraphQL request object from the execution context.
   *
   * @param {ExecutionContext} context - The execution context.
   * @return {any} The GraphQL request object.
   */
  private getGraphQLRequest(context: ExecutionContext): any {
    const [, , { req }] = context.getArgs();
    return req;
  }

  /**
   * Gets the RPC request object from the execution context.
   *
   * @param {ExecutionContext} context - The execution context.
   * @return {any} The RMQ request object.
   */
  private getRpcRequest(context: ExecutionContext): any {
    if (context.getArgByIndex(1) instanceof RmqContext) {
      const rmqContext: RmqContext = context.getArgByIndex(1);
      if (rmqContext) {
        const { headers } = rmqContext.getMessage().properties;
        return { headers };
      }
    }
    return undefined;
  }

  /**
   * Extracts the language from the request headers.
   *
   * @param {any} req - The request object.
   * @return {string | undefined} The language or undefined if not found.
   */
  private extractLanguageFromHeaders(req: any): string | undefined {
    if (req?.headers) {
      for (const key of this.keys) {
        if (req.headers[key]) {
          if (key === 'accept-language') {
            this.logger.warn(
              'HeaderResolver does not support RFC4647 Accept-Language header. Please use AcceptLanguageResolver instead.',
            );
          }
          return req.headers[key];
        }
      }
    }
    return undefined;
  }
}
