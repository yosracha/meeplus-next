import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const baseGameId = searchParams.get("baseGameId");

        if (!baseGameId) {
            return NextResponse.json({ message: "Base Game ID is required" }, { status: 400 });
        }

        const extensions = await prisma.games.findMany({
            where: {
                baseGameId: baseGameId,
                isExtension: true,
            },
            select: {
                id: true,
                title: true,
                releaseDate: true,
                posterImage: true,
                backgroundImage: true,
                globalRating: true,
                recommendedAge: true,
                playtime: true,
                difficultyLevel: {
                    select: {
                        name: true,
                        description: true,
                    },
                },
                priceRange: {
                    select: {
                        name: true,
                    },
                },
                categories: {
                    select: {
                        category: {
                            select: {
                                name: true,
                                reference: true,
                            },
                        },
                    },
                },
                authors: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                pseudo: true,
                                avatar: true,
                            },
                        },
                    },
                },
                illustrators: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                pseudo: true,
                                avatar: true,
                            },
                        },
                    },
                },
                publishers: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                pseudo: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({
            message: "Extensions retrieved successfully",
            data: extensions,
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({
            error: error.message || "Failed to retrieve extensions",
            details: error.stack,
        }, { status: 500 });
    }
}
