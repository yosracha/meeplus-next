import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const difficulties = await prisma.difficulties.findMany();
        return NextResponse.json(difficulties, { status: 200 });
    } catch (error) {
        console.error("Error fetching difficulties:", error);
        return NextResponse.json({ error: error.message || "Error retrieving difficulties" }, { status: 500 });
    }
}
