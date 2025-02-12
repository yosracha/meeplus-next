import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        if (!id) {
            return NextResponse.json({ message: "Game ID is required" }, { status: 400 });
        }

        const game = await prisma.games.findUnique({
            where: { id: id },
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
                media: true,
                collections: {
                    include: {
                        collection: {
                            include: {
                                category: true,
                            },
                        },
                    },
                },
            },
        });

        if (!game) {
            return NextResponse.json({ message: "Game not found" }, { status: 404 });
        }

        let baseGameData = null;

        if (game.isExtension && game.baseGameId) {
            baseGameData = await prisma.games.findUnique({
                where: { id: game.baseGameId },
                select: {
                    id: true,
                    title: true,
                    posterImage: true,
                    backgroundImage: true,
                    releaseDate: true,
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
        }

        const formattedGame = {
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
            isExtension: game.isExtension,
            baseGame: baseGameData ? {
                id: baseGameData.id,
                title: baseGameData.title,
                posterImage: baseGameData.posterImage,
                backgroundImage: baseGameData.backgroundImage,
                releaseDate: baseGameData.releaseDate.toISOString(),
                globalRating: baseGameData.globalRating,
                recommendedAge: baseGameData.recommendedAge,
                playtime: baseGameData.playtime,
                difficultyLevel: baseGameData.difficultyLevel
                    ? {
                        name: baseGameData.difficultyLevel.name,
                        description: baseGameData.difficultyLevel.description,
                    }
                    : null,
                priceRange: baseGameData.priceRange
                    ? {
                        name: baseGameData.priceRange.name,
                    }
                    : null,
                categories: baseGameData.categories.map((category) => ({
                    name: category.category.name,
                    reference: category.category.reference,
                })),
                authors: baseGameData.authors.map((author) => ({
                    name: `${author.user.firstName} ${author.user.lastName}`,
                    avatar: author.user.avatar,
                    pseudo: author.user.pseudo,
                })),
                illustrators: baseGameData.illustrators.map((illustrator) => ({
                    name: `${illustrator.user.firstName} ${illustrator.user.lastName}`,
                    avatar: illustrator.user.avatar,
                    pseudo: illustrator.user.pseudo,
                })),
                publishers: baseGameData.publishers.map((publisher) => ({
                    name: `${publisher.user.firstName} ${publisher.user.lastName}`,
                    avatar: publisher.user.avatar,
                    pseudo: publisher.user.pseudo,
                })),
            } : null,
        };

        return NextResponse.json(
            {
                message: "Game retrieved successfully",
                data: formattedGame,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json({
            error: error.message || "Failed to process game",
            details: error.stack,
        }, { status: 500 });
    }
}
