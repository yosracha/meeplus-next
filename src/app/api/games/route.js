import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    try {
        const games = await prisma.games.findMany();

        console.log("Jeux récupérés :", games);

        if (!games) {
            return NextResponse.json({ message: "Aucun jeu trouvé" }, { status: 404 });
        }

        if (!Array.isArray(games)) {
            return NextResponse.json({ error: "Données invalides reçues de la base de données" }, { status: 500 });
        }

        return NextResponse.json(games, { status: 200 });
    } catch (error) {
        console.error("Erreur API /games:", error);
        return NextResponse.json({ error: error.message || "Erreur lors de la récupération des jeux" }, { status: 500 });
    }
}
