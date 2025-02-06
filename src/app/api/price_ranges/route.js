import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const priceRanges = await prisma.price_ranges.findMany();
        return NextResponse.json(priceRanges, { status: 200 });
    } catch (error) {
        console.error("Error fetching price ranges:", error);
        return NextResponse.json({ error: error.message || "Error retrieving price ranges" }, { status: 500 });
    }
}
