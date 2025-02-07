import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        let filter = {};

        if (searchParams.has("name")) {
            filter.name = { contains: searchParams.get("name"), mode: "insensitive" };
        }
        if (searchParams.has("reference")) {
            filter.reference = searchParams.get("reference");
        }

        const awards = await prisma.awards.findMany({
            where: filter,
        });

        return NextResponse.json(awards, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || "Error retrieving awards" },
            { status: 500 }
        );
    }
}
