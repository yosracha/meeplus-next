import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        let filter = {};

        if (searchParams.has("level")) {
            filter.level = parseInt(searchParams.get("level"), 10);
        }
        if (searchParams.has("name")) {
            filter.name = { contains: searchParams.get("name"), mode: "insensitive" };
        }
        if (searchParams.has("reference")) {
            filter.reference = searchParams.get("reference");
        }

        const difficulties = await prisma.difficulties.findMany({
            where: filter,
        });

        return NextResponse.json(difficulties, { status: 200 });
    } catch (error) {
        console.error("Error fetching difficulties:", error);
        return NextResponse.json(
            { error: error.message || "Error retrieving difficulties" },
            { status: 500 }
        );
    }
}
