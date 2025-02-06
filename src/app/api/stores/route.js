import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const stores = await prisma.stores.findMany();
        return NextResponse.json(stores, { status: 200 });
    } catch (error) {
        console.error("Error fetching stores:", error);
        return NextResponse.json({ error: error.message || "Error retrieving stores" }, { status: 500 });
    }
}
