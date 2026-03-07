import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
  await connectDB();

  const users = await User.find().sort({ createdAt: -1 });

  return NextResponse.json(users);
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, email, password, role } = body;

    const existing = await User.findOne({ email });

    if (existing) {
      return NextResponse.json(
        { error: "Пользователь с таким email уже существует" },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
