import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const collections = await prisma.collections.findMany();
        return NextResponse.json(collections, { status: 200 });
    } catch (error) {
        console.error("Error fetching collections:", error);
        return NextResponse.json({ error: error.message || "Error retrieving collections" }, { status: 500 });
    }
}
