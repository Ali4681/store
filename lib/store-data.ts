import type { Prisma } from "@prisma/client";
import type { StoreOwner } from "@/lib/auth";

type Transaction = Prisma.TransactionClient;

export async function moveGuestDataToUser(
  transaction: Transaction,
  sessionId: string | undefined,
  userId: string,
) {
  if (
    !sessionId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    )
  ) {
    return;
  }

  const [guestCart, userCart, guestFavorites] = await Promise.all([
    transaction.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    }),
    transaction.cart.findUnique({
      where: { userId },
      include: { items: true },
    }),
    transaction.favorite.findMany({ where: { sessionId } }),
  ]);

  if (guestCart) {
    if (!userCart) {
      await transaction.cart.update({
        where: { id: guestCart.id },
        data: { sessionId: null, userId },
      });
    } else {
      for (const item of guestCart.items) {
        await transaction.cartItem.upsert({
          where: {
            cartId_productId: { cartId: userCart.id, productId: item.productId },
          },
          create: {
            cartId: userCart.id,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: { quantity: { increment: item.quantity } },
        });
      }
      await transaction.cart.delete({ where: { id: guestCart.id } });
    }
  }

  if (guestFavorites.length) {
    await transaction.favorite.createMany({
      data: guestFavorites.map((favorite) => ({
        userId,
        productId: favorite.productId,
      })),
      skipDuplicates: true,
    });
    await transaction.favorite.deleteMany({ where: { sessionId } });
  }
}

export function ownerLookup(owner: StoreOwner) {
  return owner.kind === "user"
    ? { userId: owner.userId }
    : { sessionId: owner.sessionId };
}

export function ownerCreate(owner: StoreOwner) {
  return owner.kind === "user"
    ? { userId: owner.userId }
    : { sessionId: owner.sessionId };
}
