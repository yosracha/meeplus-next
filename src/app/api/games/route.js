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
                collections: {
                    include: {
                        collection: true,
                    },
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
            playtime: game.playtime,
            globalRating: game.globalRating,
            description: game.description,
            isExtension: game.isExtension,
            baseGameId: game.baseGameId,
            available: game.available,
            posterImage: game.posterImage,
            backgroundImage: game.backgroundImage,
            difficultyLevel: game.difficultyLevel
                ? {
                    name: game.difficultyLevel.name,
                    description: game.difficultyLevel.description,
                }
                : null,
            priceRange: game.priceRange
                ? {
                    name: game.priceRange.name,
                }
                : null,
            categories: game.categories.map((category) => ({
                name: category.category.name,
                reference: category.category.reference,
            })),
            storesLinks: game.storesLinks.map((storeLink) => ({
                name: storeLink.store.name,
                url: storeLink.url,
            })),
            gameAwards: game.gameAwards.map((award) => ({
                name: award.award.name,
                year: award.year,
            })),
            authors: game.authors.map((author) => ({
                name: `${author.user.firstName} ${author.user.lastName}`,
                avatar: author.user.avatar,
                pseudo: author.user.pseudo,
            })),
            illustrators: game.illustrators.map((illustrator) => ({
                name: `${illustrator.user.firstName} ${illustrator.user.lastName}`,
                avatar: illustrator.user.avatar,
                pseudo: illustrator.user.pseudo,
            })),
            publishers: game.publishers.map((publisher) => ({
                name: `${publisher.user.firstName} ${publisher.user.lastName}`,
                avatar: publisher.user.avatar,
                pseudo: publisher.user.pseudo,
            })),
            collections: game.collections.map((collection) => ({
                name: collection.collection.name,
                description: collection.collection.description,
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
            details: error.stack,
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        let body;
        try {
            body = await req.json();
        } catch (error) {
            return NextResponse.json({ error: "Invalid JSON format.", details: error.message }, { status: 400 });
        }

        if (!body || !Array.isArray(body) || body.length === 0) {
            return NextResponse.json({ error: "Request body must be a non-empty JSON array." }, { status: 400 });
        }

        for (const game of body) {
            if (!game.title || !game.releaseDate) {
                return NextResponse.json({ error: "Missing required fields.", details: `The game "${game.title || 'Unknown'}" is missing title or releaseDate.` }, { status: 400 });
            }

            let existingGame = await prisma.games.findFirst({ where: { title: game.title } });

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
                        baseGameId: game.baseGameId,
                        available: game.available,
                        updatedAt: new Date(),
                        difficultyLevelId: game.difficultyLevel ?? existingGame.difficultyLevelId,
                        priceRangeId: game.priceRange ?? existingGame.priceRangeId,
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
                        baseGameId: game.baseGameId,
                        available: game.available,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        difficultyLevelId: game.difficultyLevel ?? null,
                        priceRangeId: game.priceRange ?? null,
                    }
                });
            }

            if (game.categories?.length > 0) {
                const validCategories = await prisma.categories.findMany({ where: { id: { in: game.categories } } });
                const categoryIds = validCategories.map(cat => cat.id);

                await prisma.game_categories.deleteMany({ where: { gameId: insertedGame.id } });

                if (categoryIds.length > 0) {
                    await prisma.game_categories.createMany({
                        data: categoryIds.map(categoryId => ({ gameId: insertedGame.id, categoryId }))
                    });
                }
            }

            if (game.awards?.length > 0) {
                const validAwards = await prisma.awards.findMany({ where: { id: { in: game.awards } } });
                const awardIds = validAwards.map(award => award.id);

                await prisma.game_awards.deleteMany({ where: { gameId: insertedGame.id } });

                if (awardIds.length > 0) {
                    await prisma.game_awards.createMany({
                        data: awardIds.map(awardId => ({
                            gameId: insertedGame.id,
                            awardId,
                            year: new Date().getFullYear()
                        }))
                    });
                }
            }

            const creators = [
                { type: "authors", table: "game_user_authors" },
                { type: "illustrators", table: "game_user_illustrators" },
                { type: "publishers", table: "game_user_publishers" }
            ];

            for (const creator of creators) {
                if (game.creators?.[creator.type]?.length > 0) {
                    const validUsers = await prisma.users.findMany({ where: { id: { in: game.creators[creator.type] } } });
                    const userIds = validUsers.map(user => user.id);

                    await prisma[creator.table].deleteMany({ where: { gameId: insertedGame.id } });

                    if (userIds.length > 0) {
                        await prisma[creator.table].createMany({
                            data: userIds.map(userId => ({ gameId: insertedGame.id, userId }))
                        });
                    }
                }
            }

            if (game.storesLinks?.length > 0) {
                const storeIds = game.storesLinks.map(store => store.store_id);
                const validStores = await prisma.stores.findMany({ where: { id: { in: storeIds } } });

                const validStoreIds = validStores.map(store => store.id);

                await prisma.store_links.deleteMany({ where: { gameId: insertedGame.id } });

                if (validStoreIds.length > 0) {
                    await prisma.store_links.createMany({
                        data: game.storesLinks
                            .filter(store => validStoreIds.includes(store.store_id))
                            .map(store => ({
                                gameId: insertedGame.id,
                                storeId: store.store_id,
                                url: store.url
                            }))
                    });
                }
            }

            if (game.collection?.length > 0) {
                const validCollections = await prisma.collections.findMany({ where: { id: { in: game.collection } } });
                const collectionIds = validCollections.map(collection => collection.id);

                await prisma.game_collections.deleteMany({ where: { gameId: insertedGame.id } });

                if (collectionIds.length > 0) {
                    await prisma.game_collections.createMany({
                        data: collectionIds.map(collectionId => ({ gameId: insertedGame.id, collectionId }))
                    });
                }
            }
        }

        return NextResponse.json({ message: "Games and related data inserted/updated successfully." }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ error: "An unexpected error occurred.", details: error.message }, { status: 500 });
    }
}
