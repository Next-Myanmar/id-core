import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import {
  GraphQLModule as BaseGraphQLModule,
  GqlModuleOptions,
} from '@nestjs/graphql';
import { DateScalar } from './date.scalar';

@Module({})
export class GraphQLModule {
  static forRoot(options?: GqlModuleOptions) {
    return {
      module: GraphQLModule,
      imports: [
        BaseGraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
          driver: ApolloFederationDriver,
          useFactory: async () => {
            const isDevelopment = process.env.NODE_ENV !== 'prod';

            return {
              autoSchemaFile: {
                federation: 2,
              },
              formatError: (error: any) => {
                const originalError = error.extensions?.originalError;

                if (originalError) {
                  originalError.statusCode = undefined;
                  error.extensions = {
                    ...error.extensions,
                    ...originalError,
                  };
                  delete error.extensions.originalError;
                }

                if (!isDevelopment) {
                  delete error.extensions.stacktrace;
                  delete error.extensions.serviceName;
                }

                return error;
              },
              playground: isDevelopment,
              context: ({ req, res }) => ({ req, res }),
              ...options,
            };
          },
        }),
      ],
      providers: [DateScalar],
    };
  }
}
