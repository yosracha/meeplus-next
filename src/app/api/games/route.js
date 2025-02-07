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
            console.error("JSON Parsing Error:", error);
            return NextResponse.json({
                error: "Invalid JSON format in request body.",
                details: error.message
            }, { status: 400 });
        }

        if (!body || !Array.isArray(body) || body.length === 0) {
            return NextResponse.json({
                error: "Request body must be a non-empty JSON array."
            }, { status: 400 });
        }

        for (const game of body) {
            if (!game.title || !game.releaseDate) {
                return NextResponse.json({
                    error: "Missing required fields.",
                    details: `The game "${game.title || 'Unknown'}" is missing title or releaseDate.`
                }, { status: 400 });
            }

            try {
                let existingGame = await prisma.games.findFirst({
                    where: { title: game.title }
                });

                let insertedGame;
                if (existingGame) {
                    insertedGame = await prisma.games.update({
                        where: { id: existingGame.id },
                        data: {
                            releaseDate: new Date(game.releaseDate),
                            playerCount: game.playerCount,
                            recommendedAge: game.recommendedAge,
                            playtime: game.playtime,
                            description: game.description,
                            isExtension: game.isExtension,
                            available: game.available,
                            updatedAt: new Date(),
                            ...(game.difficultyLevel ? { difficultyLevelId: game.difficultyLevel } : {}),
                            ...(game.priceRange ? { priceRangeId: game.priceRange } : {}),
                        }
                    });
                } else {
                    insertedGame = await prisma.games.create({
                        data: {
                            title: game.title,
                            releaseDate: new Date(game.releaseDate),
                            playerCount: game.playerCount,
                            recommendedAge: game.recommendedAge,
                            playtime: game.playtime,
                            description: game.description,
                            isExtension: game.isExtension,
                            available: game.available,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            ...(game.difficultyLevel ? { difficultyLevelId: game.difficultyLevel } : {}),
                            ...(game.priceRange ? { priceRangeId: game.priceRange } : {}),
                        }
                    });
                }

                if (game.categories?.length > 0) {
                    const validCategories = await prisma.categories.findMany({
                        where: { id: { in: game.categories } },
                        select: { id: true }
                    });

                    if (validCategories.length === 0) {
                        return NextResponse.json({
                            error: "Invalid categories.",
                            details: `No valid categories found for the game "${game.title}".`
                        }, { status: 400 });
                    }

                    await prisma.game_categories.createMany({
                        data: validCategories.map(category => ({
                            gameId: insertedGame.id,
                            categoryId: category.id
                        }))
                    });
                }

                if (game.awards?.length > 0) {
                    const validAwards = await prisma.awards.findMany({
                        where: { id: { in: game.awards } },
                        select: { id: true }
                    });

                    if (validAwards.length === 0) {
                        return NextResponse.json({
                            error: "Invalid awards.",
                            details: `No valid awards found for the game "${game.title}".`
                        }, { status: 400 });
                    }

                    await prisma.game_awards.createMany({
                        data: validAwards.map(award => ({
                            gameId: insertedGame.id,
                            awardId: award.id,
                            year: new Date().getFullYear()
                        }))
                    });
                }

                const creators = [
                    { type: "authors", table: "game_user_authors" },
                    { type: "illustrators", table: "game_user_illustrators" },
                    { type: "publishers", table: "game_user_publishers" }
                ];

                for (const creator of creators) {
                    if (game.creators?.[creator.type]?.length > 0) {
                        const validUsers = await prisma.users.findMany({
                            where: { id: { in: game.creators[creator.type] } },
                            select: { id: true }
                        });

                        if (validUsers.length === 0) {
                            return NextResponse.json({
                                error: `Invalid ${creator.type}.`,
                                details: `No valid ${creator.type} found for the game "${game.title}".`
                            }, { status: 400 });
                        }

                        await prisma[creator.table].createMany({
                            data: validUsers.map(user => ({
                                gameId: insertedGame.id,
                                userId: user.id
                            }))
                        });
                    }
                }

                if (game.storesLinks?.length > 0) {
                    const validStores = await prisma.stores.findMany({
                        where: { id: { in: game.storesLinks.map(store => store.store_id) } },
                        select: { id: true }
                    });

                    if (validStores.length === 0) {
                        return NextResponse.json({
                            error: "Invalid stores.",
                            details: `No valid stores found for the game "${game.title}".`
                        }, { status: 400 });
                    }

                    await prisma.store_links.createMany({
                        data: game.storesLinks
                            .filter(store => validStores.some(validStore => validStore.id === store.store_id))
                            .map(store => ({
                                gameId: insertedGame.id,
                                storeId: store.store_id,
                                url: store.url
                            }))
                    });
                }

                if (game.collection?.length > 0) {
                    const validCollections = await prisma.collections.findMany({
                        where: { id: { in: game.collection } },
                        select: { id: true }
                    });

                    if (validCollections.length === 0) {
                        return NextResponse.json({
                            error: "Invalid collections.",
                            details: `No valid collections found for the game "${game.title}".`
                        }, { status: 400 });
                    }

                    await prisma.game_collections.createMany({
                        data: validCollections.map(collection => ({
                            gameId: insertedGame.id,
                            collectionId: collection.id
                        }))
                    });
                }

            } catch (gameError) {
                console.error(`Error processing game "${game.title}":`, gameError);
                return NextResponse.json({
                    error: `Failed to process game "${game.title}".`,
                    details: gameError.message
                }, { status: 500 });
            }
        }

        return NextResponse.json({
            message: "Games and related data inserted/updated successfully."
        }, { status: 200 });

    } catch (error) {
        console.error("Unexpected error:", error);
        return NextResponse.json({
            error: "An unexpected error occurred.",
            details: error.message
        }, { status: 500 });
    }
}
