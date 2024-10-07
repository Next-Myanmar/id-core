import { generateClientId, generateClientSecret } from '../utils/utils';
import { Grant, PrismaClient } from './generated';

const prisma = new PrismaClient();

async function createUsersApp() {
  const client = await prisma.clientOauth.create({
    data: {
      clientId: generateClientId(),
      clientSecret: generateClientSecret(),
      grants: [Grant.refresh_token],
      name: 'Users App',
    },
  });

  console.log('Client Oauth Id: ', client.id);
}

createUsersApp()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
