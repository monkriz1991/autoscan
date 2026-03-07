import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Service from "@/models/Service";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { name, parentId, businessId } = body;

    let level = 1;

    if (parentId) {
      const parent = await Service.findById(parentId);
      if (!parent) {
        return NextResponse.json(
          { error: "Parent not found" },
          { status: 400 },
        );
      }

      if (parent.level >= 5) {
        return NextResponse.json(
          { error: "Max level reached (5)" },
          { status: 400 },
        );
      }

      level = parent.level + 1;
    }

    const service = await Service.create({
      name,
      parent: parentId || null,
      level,
      businessId,
    });

    return NextResponse.json(service);
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const businessId = searchParams.get("businessId");

  const filter: any = { businessId };

  if (parentId === "null") {
    filter.parent = null;
  } else if (parentId) {
    filter.parent = parentId;
  }

  const services = await Service.find({ businessId }).lean();

  return NextResponse.json(services);
}

export async function DELETE(req: Request) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "No id provided" }, { status: 400 });
  }

  // удаляем категорию и все её дочерние
  await deleteWithChildren(id);

  return NextResponse.json({ success: true });
}

async function deleteWithChildren(id: string) {
  const children = await Service.find({ parentId: id });

  for (const child of children) {
    await deleteWithChildren(child._id.toString());
  }

  await Service.findByIdAndDelete(id);
}
