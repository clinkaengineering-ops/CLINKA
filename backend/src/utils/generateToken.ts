import jwt from "jsonwebtoken";

function generateToken(userId: number, role: string) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    { userId, role },
    secret,
    {
      expiresIn: (process.env.JWT_EXPIRES_IN as any) || "1d",
    }
  );
}


export default generateToken;