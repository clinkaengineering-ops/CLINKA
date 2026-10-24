import jwt from "jsonwebtoken";

function generateToken(userId: string, role: string, expiresIn?: string | number) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    { userId, role },
    secret,
    {
      expiresIn: (expiresIn || process.env.JWT_EXPIRES_IN || "30d") as any,
    }
  );
}


export default generateToken;