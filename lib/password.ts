import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const SCRYPT_KEY_LENGTH = 64;

function deriveKey(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_KEY_LENGTH,
      {
        N: 32768,
        r: 8,
        p: 1,
        maxmem: 64 * 1024 * 1024,
      },
      (error, derivedKey) => {
        if (error) reject(error);
        else resolve(derivedKey);
      },
    );
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await deriveKey(password, salt);

  return `scrypt$32768$8$1$${salt}$${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, cost, blockSize, parallelization, salt, keyHex] =
    storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    cost !== "32768" ||
    blockSize !== "8" ||
    parallelization !== "1" ||
    !salt ||
    !keyHex ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(keyHex)
  ) {
    return false;
  }

  const expected = Buffer.from(keyHex, "hex");
  const actual = await deriveKey(password, salt);
  return timingSafeEqual(actual, expected);
}
