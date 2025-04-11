import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
    return new PrismaClient();
};

// Use a global variable to prevent multiple Prisma instances in development
declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}
