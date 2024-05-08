import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            const to = ctx.from
            await flowDynamic('\u{1F4A1} Send File:\n')
            await flowDynamic('⚠️ *Param file must be a file with one of the following types ⚠️*\n  * audio/aac\n  * audio/mp4\n  * audio/mpeg\n  * audio/amr\n  * audio/ogg\n  * audio/opus\n  * application/vnd.ms-powerpoint\n  * application/msword\n  * application/vnd.openxmlformats-officedocument.wordprocessingml.document\n  * application/vnd.openxmlformats-officedocument.presentationml.presentation\n  * application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\n  * application/pdf\n  * text/plain\n  * application/vnd.ms-excel\n  * image/jpeg\n  * image/png\n  * image/webp\n  * video/mp4\n  * video/3gpp')
            await provider.sendFile(to, './src/sendFile/app.txt')
            await provider.sendFile(to, './src/sendFile/pdf.pdf')
        }
    )


const main = async () => {
    const adapterFlow = createFlow([welcomeFlow])
    const adapterProvider = createProvider(Provider, {
        jwtToken: process.env.JWTTOKEN,
        numberId: process.env.NUMBERID,
        verifyToken: process.env.VERIFYTOKEN,
        version: "v18.0",
    })
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    httpServer(+PORT)

    adapterProvider.http.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.http.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.http.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )
}

main()
