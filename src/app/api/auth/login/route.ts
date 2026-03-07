import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();

  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const isValid = await comparePassword(password, user.password);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const token = signToken({
    userId: user._id,
    role: user.role,
    businessId: user.businessId,
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
  });

  return response;
}
