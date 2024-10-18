import { Module } from '@nestjs/common';
import { ChangePasswordResolver } from './resolvers/change-password.resolver';
import { GetPersonalDetailsResolver } from './resolvers/get-personal-details.resolver';
import { UpdatePersonalDetailsResolver } from './resolvers/update-personal-details.resolver';
import { ChangePasswordService } from './services/chage-password.service';
import { GetPersonalDetailsService } from './services/get-personal-details.service';
import { UpdatePersonalDetailsService } from './services/update-personal-details.service';

@Module({
  imports: [],
  controllers: [],
  providers: [
    GetPersonalDetailsService,
    GetPersonalDetailsResolver,
    UpdatePersonalDetailsService,
    UpdatePersonalDetailsResolver,
    ChangePasswordService,
    ChangePasswordResolver,
  ],
})
export class ProfileModule {}
