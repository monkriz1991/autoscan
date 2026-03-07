import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Business from "@/models/Business";
import { hashPassword, signToken } from "@/lib/auth";
import { nanoid } from "nanoid";
import slugify from "slugify";

export async function POST(req: Request) {
  try {
    await connectDB();

    const { email, password, businessName, name } = await req.json();

    if (!email || !password || !businessName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    /* =========================
       Генерация slug
    ========================== */

    const baseSlug = slugify(businessName, {
      lower: true,
      strict: true,
      trim: true,
    });

    const slug = `${baseSlug}-${nanoid(6)}`;

    /* =========================
       Создание бизнеса
    ========================== */

    const business = await Business.create({
      name: businessName,
      slug,
      widgetKey: nanoid(16),
    });

    /* =========================
       Создание пользователя
    ========================== */

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: name || "",
      email,
      password: hashedPassword,
      role: "BUSINESS_OWNER",
      businessId: business._id,
    });

    business.ownerId = user._id;
    await business.save();

    /* =========================
       JWT
    ========================== */

    const token = signToken({
      userId: user._id,
      role: user.role,
      businessId: business._id,
    });

    const response = NextResponse.json({
      success: true,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
