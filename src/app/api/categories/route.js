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

        const categories = await prisma.categories.findMany({
            where: filter,
        });

        return NextResponse.json(categories, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error.message || "Error retrieving categories" },
            { status: 500 }
        );
    }
}
