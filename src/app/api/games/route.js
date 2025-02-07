import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const games = await prisma.games.findMany({
            include: {
                difficultyLevel: true,
                priceRange: true,
                categories: {
                    include: { category: true },
                },
                storesLinks: {
                    include: { store: true },
                },
                collections: true,
                gameAwards: {
                    include: { award: true },
                },
                authors: {
                    include: { user: true },
                },
                illustrators: {
                    include: { user: true },
                },
                publishers: {
                    include: { user: true },
                },
                media: true,
            },
        });

        if (!games || games.length === 0) {
            return NextResponse.json({ message: "No games found" }, { status: 404 });
        }

        const formattedGames = games.map((game) => ({
            id: game.id,
            title: game.title,
            releaseDate: game.releaseDate.toISOString(),
            recommendedAge: game.recommendedAge,
            difficultyLevel: {
                name: game.difficultyLevel.name,
                description: game.difficultyLevel.description,
            },
            priceRange: {
                name: game.priceRange.name,
            },
            categories: game.categories.map((category) => ({
                category: {
                    name: category.category.name,
                },
            })),
            storesLinks: game.storesLinks.map((storeLink) => ({
                store: {
                    name: storeLink.store.name,
                },
                url: storeLink.url,
            })),
            gameAwards: game.gameAwards.map((award) => ({
                award: {
                    name: award.award.name,
                },
                year: award.year,
            })),
            authors: game.authors.map((author) => ({
                user: {
                    name: `${author.user.firstName} ${author.user.lastName}`,
                },
            })),
            illustrators: game.illustrators.map((illustrator) => ({
                user: {
                    name: `${illustrator.user.firstName} ${illustrator.user.lastName}`,
                },
            })),
            publishers: game.publishers.map((publisher) => ({
                user: {
                    name: `${publisher.user.firstName} ${publisher.user.lastName}`,
                },
            })),
        }));

        return NextResponse.json(
            {
                message: "Games retrieved successfully",
                data: formattedGames,
            },
            { status: 200 }
        );
    } catch (error) {

        return NextResponse.json({
            error: error.message || "Failed to process games",
            details: error.stack
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {

        let body;
        try {
            body = await req.json();
        } catch (error) {
            console.log(error)
            return NextResponse.json({ error: "Invalid JSON format in request body" }, { status: 400 });
        }

        if (!body || !Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: "Request body must be a non-empty JSON array" }, { status: 400 });
        }

        for (const game of body) {

            if (!game.title || !game.releaseDate || !game.difficultyLevel || !game.priceRange) {
                return NextResponse.json({ error: `Game is missing required fields: ${game.title}` }, { status: 400 });
            }

            let gameId = game.id;
            const insertedGame = await prisma.games.upsert({
                where: { id: gameId },
                update: {
                    releaseDate: new Date(game.releaseDate),
                    difficultyLevelId: game.difficultyLevel,
                    priceRangeId: game.priceRange,
                    playerCount: game.playerCount,
                    recommendedAge: game.recommendedAge,
                    playtime: game.playtime,
                    description: game.description,
                    isExtension: game.isExtension,
                    available: game.available,
                    updatedAt: new Date(),
                },
                create: {
                    id: gameId,
                    title: game.title,
                    releaseDate: new Date(game.releaseDate),
                    difficultyLevelId: game.difficultyLevel,
                    priceRangeId: game.priceRange,
                    playerCount: game.playerCount,
                    recommendedAge: game.recommendedAge,
                    playtime: game.playtime,
                    description: game.description,
                    isExtension: game.isExtension,
                    available: game.available,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }
            });
            if (game.categories && game.categories.length > 0) {

                await prisma.game_categories.createMany({
                    data: game.categories.map(categoryId => ({
                        gameId: insertedGame.id,
                        categoryId: categoryId
                    })),
                });

            }

            if (game.awards && game.awards.length > 0) {

                await prisma.game_awards.createMany({
                    data: game.awards.map(awardId => ({
                        gameId: insertedGame.id,
                        awardId: awardId,
                        year: new Date().getFullYear()
                    })),
                });

            }

            const creators = [
                { type: "authors", table: "game_user_authors" },
                { type: "illustrators", table: "game_user_illustrators" },
                { type: "publishers", table: "game_user_publishers" }
            ];

            for (const creator of creators) {
                if (game.creators[creator.type] && game.creators[creator.type].length > 0) {
                    await prisma[creator.table].createMany({
                        data: game.creators[creator.type].map(userId => ({
                            gameId: insertedGame.id,
                            userId: userId
                        })),
                    });

                }
            }

            if (game.storesLinks && game.storesLinks.length > 0) {

                await prisma.store_links.createMany({
                    data: game.storesLinks.map(store => ({
                        gameId: insertedGame.id,
                        storeId: store.store_id,
                        url: store.url
                    }))
                });

            }

            if (game.collection && game.collection.length > 0) {

                await prisma.game_collections.createMany({
                    data: game.collection.map(collectionId => ({
                        gameId: insertedGame.id,
                        collectionId: collectionId
                    }))
                });
            }
        }

        return NextResponse.json({ message: "Games and related data inserted/updated successfully" }, { status: 200 });

    } catch (error) {

        return NextResponse.json({
            error: error.message || "Failed to process games",
            details: error.stack
        }, { status: 500 });
    }

}
