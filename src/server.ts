import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";

const port = 3000;
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (_, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc"
        },
        include: {
            genres: true,
            languages: true
        }
    });
    res.json(movies);
});

app.post('/movies', async (req, res) => {

    const { title, genre_id, language_id, oscar_count, release_date } = req.body;

    try {

        const movieWithSameTitle = await prisma.movie.findFirst({
            where: { title: { equals: title, mode: "insensitive" } }
        })

        if(movieWithSameTitle){
            return res.status(409).send({ menssage: "Já existe um filme cadastrado com esse ítulo" });
        }

        await prisma.movie.create({
            data: {
                title: title,
                genre_id: genre_id,
                language_id: language_id,
                oscar_count: oscar_count,
                release_date: new Date(release_date),
            }
        });
    } catch (error) {
        return res.status(500).send({menssage: "Falha ao cadastrar um filme"});
    }
    
    res.status(200).send();
});

app.put("/movies/:id", async (req, res) => {
    // pegar o id do registro que vai ser atualizado
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: {
                id
            }
        });
    
        if(!movie){
            return res.status(404).send({ message: "Filme não encontrado" });
        }
    
        const data = { ...req.body };
        data.release_date = data.release_date ? new Date(data.release_date) : undefined;
    
        // pegar os dados do filme que será atualizado e atualizar ele no prisma
        await prisma.movie.update({
            where: {
                id
            },
            data: data
        });
    } catch (error) {
        return res.status(500).send({ menssage: "Falha ao atualizar o registro do filme" });
    }

    // retornar o status correto informando que o filme foi atualizado
    res.status(200).send()
});

app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({ where: { id } });

        if(!movie){
            return res.status(404).send({ message: "O filme não foi encontrado" });
        }

        await prisma.movie.delete({ where: { id } });
    } catch (error) {
        return res.status(500).send({ message: "Não foi possivel remover o filme" });
    }

    res.status(200).send();
});

app.get("/movies/:genreName", async (req, res) => {
    try {
        const moviesFilterdByGenderName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genreName,
                        mode: "insensitive",
                    }
                }
            }
        });

        res.status(200).send(moviesFilterdByGenderName);
    } catch (error) {
        res.status(500).send({ message: "Falha ao filtrar filmes por gênero" });
    }
});

app.get("/genres", async (_, res) => {

    try {
        const genres = await prisma.genre.findMany({
            orderBy: {
                name: "asc"
            }
        });

        res.status(200).json(genres);

    } catch (error) {
        return res.status(500).send({ message: "Falha ao buscar gêneros" })
    }
});

app.post("/genres", async (req, res) => {
    const { name } = req.body;

    if(!name) {
        return res.status(400).send({ message: "O nome do gênero é obrigatório" });
    }

    try {
        const genre = await prisma.genre.findFirst({
            where: { name: { equals: name, mode: "insensitive" } }
        });

        if(genre){
            return res.status(409).send({ message: "Esse gênero ja existe" });
        }

        const newGenre = await prisma.genre.create({
            data: { name }
        });

        res.status(201).json(newGenre);

    } catch (error) {
        return res.status(500).send({ message: "Falha ao adicionar o registro do gênero" });
    }
});

app.put("/genres/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    if(!name){
        return res.status(400).send({ message: "O nome do gênero é obrigatório" });
    }

    try {
        const genre = await prisma.genre.findUnique({
            where: { id }
        });

        if(!genre) {
            return res.status(404).send({ message: "Gênero não econtrado" });
        }

        const existingGenre = await prisma.genre.findFirst({
            where: {
                name: {
                    equals: name, mode: "insensitive"
                },
                id: { not: id }
            }
        });

        if(existingGenre){
            return res.status(409).send({ message: "Este nome de gênero ja existe." });
        }

        const updateGenre = await prisma.genre.update({
            where: { id },
            data: { name }
        });

        res.status(200).send(updateGenre);
    } catch (error) {
        return res.status(500).send({ message: "Falha em atualizar o registro do gênero" });
    }

});

app.listen(port, () => {
    console.log(`Servidor em execução na porta ${port}: http://localhost:${port}`);
});
