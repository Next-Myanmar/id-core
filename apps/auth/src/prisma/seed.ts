import { Grant, PrismaClient } from '@app/prisma/auth';
import { generateClientId } from '../utils/utils';

const prisma = new PrismaClient();

async function createUsersApp() {
  const client = await prisma.clientOauth.create({
    data: {
      clientId: generateClientId(),
      redirectUri: '',
      grants: [Grant.RefreshToken],
      clientName: 'Users App',
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
