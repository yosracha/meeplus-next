import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const collectionId = searchParams.get("collection");

        if (!collectionId) {
            return NextResponse.json({ message: "Collection ID is required as a query parameter." }, { status: 400 });
        }

        const collection = await prisma.collections.findUnique({
            where: { id: collectionId },
            include: {
                gameCollections: {
                    include: {
                        game: true,
                    },
                },
            },
        });

        if (!collection) {
            return NextResponse.json({ message: "Collection not found." }, { status: 404 });
        }

        const gamesInCollection = collection.gameCollections.map(gc => ({
            id: gc.game.id,
            title: gc.game.title,
            releaseDate: gc.game.releaseDate,
            posterImage: gc.game.posterImage,
            backgroundImage: gc.game.backgroundImage,
            globalRating: gc.game.globalRating,
            recommendedAge: gc.game.recommendedAge,
            playtime: gc.game.playtime,
        }));

        return NextResponse.json({
            message: "Games retrieved successfully from the collection",
            data: {
                collection: {
                    id: collection.id,
                    name: collection.name,
                    description: collection.description,
                },
                games: gamesInCollection,
            },
        }, { status: 200 });

    } catch (error) {
        console.log(error.stack)
        console.error("Error retrieving games from collection:", error);
        return NextResponse.json({
            error: error.message || "Failed to retrieve games from collection",
            details: error.stack,
        }, { status: 500 });
    }
}
