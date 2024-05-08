import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008



const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            await flowDynamic('\u{1F4A1} Send Message Meta:\n')
            const to = ctx.from
            provider.sendMessageMeta(
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: "text",
                    text: {
                        preview_url: true,
                        body: 'Welcome to the BOT\nhttps://www.chavazystem.tech'
                    }
                }
            )
            //NOTE: types.d.ts interface TextMessageBody on Image change id for link
            provider.sendMessageMeta(
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: "image",
                    image: {
                        link: "https://wallpapers.com/images/hd/anonymous-4k-mask-man-in-rain-mhbzf6y4wc5xhjzk.jpg"
                    }
                }
            )
            //NOTE: types.d.ts interface TextMessageBody on Video change id for link
            provider.sendMessageMeta(
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: "video",
                    video: {
                        link: 'https://bot-whatsapp.netlify.app/videos/console.mp4'
                    }
                }
            )
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

    adapterProvider.on('require_action', async (ctx) => {
        console.log(`***** Here *****\n ${JSON.stringify(ctx, null, 5)}`)
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
