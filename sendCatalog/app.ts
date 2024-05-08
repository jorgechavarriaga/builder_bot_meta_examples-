import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008

//TODO: PRODUCT MUST BE ADDED TO 

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            const to = ctx.from
            await flowDynamic('\u{1F4A1} Send Catalog')
            await provider.sendCatalog(
                to,
                'Catalog',
                '454652887237262'
            )
            provider.sendMessageMeta(
                {
                    messaging_product: 'whatsapp',
                    to,
                    type: "interactive",
                    interactive: {
                        type: "product",
                        body: {
                            text: "optional body text"
                        },
                        footer: {
                            text: "optional footer text"
                        },
                        action: {
                            catalog_id: "454652887237262",
                            product_retailer_id: "ID_TEST_ITEM_1"
                        }
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
