import crypto from "crypto";
import { prisma } from "./prisma";

// Excludes visually ambiguous characters (0/O, 1/I/L) since a guest has
// to read this off a screen and type it back in later.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(length = 7): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += ALPHABET[crypto.randomInt(ALPHABET.length)];
  }
  return code;
}

/** A guest's entire "login" is this code + their name — collisions must
 * be impossible, not just unlikely, so this checks the DB and retries. */
export async function uniqueBookingCode(): Promise<string> {
  let code = randomCode();
  while (await prisma.booking.findUnique({ where: { bookingCode: code }, select: { id: true } })) {
    code = randomCode();
  }
  return code;
}
