import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const filters = {};

        if (searchParams.has("reference")) {
            filters.reference = searchParams.get("reference");
        }
        if (searchParams.has("name")) {
            filters.name = { contains: searchParams.get("name"), mode: "insensitive" };
        }
        if (searchParams.has("website")) {
            filters.website = { contains: searchParams.get("website"), mode: "insensitive" };
        }

        const stores = await prisma.stores.findMany({
            where: filters
        });

        if (stores.length === 0) {
            return NextResponse.json({ message: "No stores found" }, { status: 404 });
        }

        return NextResponse.json(stores, { status: 200 });

    } catch (error) {
        console.error("Error fetching stores:", error);
        return NextResponse.json({ error: error.message || "Error retrieving stores" }, { status: 500 });
    }
}
