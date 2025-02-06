import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const awards = await prisma.awards.findMany();
        return NextResponse.json(awards, { status: 200 });
    } catch (error) {
        console.error("Error fetching awards:", error);
        return NextResponse.json({ error: error.message || "Error retrieving awards" }, { status: 500 });
    }
}
