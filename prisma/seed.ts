// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed 10 products
  const products = [];
  for (let i = 0; i < 10; i++) {
    const product = {
      name: faker.commerce.productName(),
      slug: faker.lorem.slug(),
      description: faker.lorem.paragraph(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 500, dec: 2 })),
      stock: faker.number.int({ min: 5, max: 100 }),
      images: [faker.image.url()],

    };
    products.push(product);
  }
  await prisma.product.createMany({
    data: products,
  });

  // Seed 10 users with hashed passwords and create a cart for each
  const users = [];
  for (let i = 0; i < 10; i++) {
    const hashedPassword = await bcrypt.hash(faker.internet.password(), 10);
    const user = {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: hashedPassword,
    };
    const createdUser = await prisma.user.create({
      data: user,
    });

    // Create a cart for each user
    await prisma.cart.create({
      data: {
        userId: createdUser.id,
      },
    });
    users.push(createdUser);
  }

  console.log('Database seeded with 10 products and 10 users!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
