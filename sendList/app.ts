import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            await flowDynamic('\u{1F4A1} Send List:')
            const to = ctx.from
            const listParams = {
                type: "list",
                header: {
                    type: "text",
                    text: "HEADER_TEXT"
                },
                body: {
                    text: "BODY_TEXT"
                },
                footer: {
                    text: "FOOTER_TEXT"
                },
                action: {
                    button: "BUTTON_TEXT",
                    sections: [
                        {
                            title: "SECTION_1_TITLE",
                            rows: [
                                {
                                    id: "SECTION_1_ROW_1_ID",
                                    title: "SECTION_1_ROW_1_TITLE",
                                    description: "SECTION_1_ROW_1_DESCRIPTION"
                                },
                                {
                                    id: "SECTION_1_ROW_2_ID",
                                    title: "SECTION_1_ROW_2_TITLE",
                                    description: "SECTION_1_ROW_2_DESCRIPTION"
                                }
                            ]
                        },
                        {
                            title: "SECTION_2_TITLE",
                            rows: [
                                {
                                    id: "SECTION_2_ROW_1_ID",
                                    title: "SECTION_2_ROW_1_TITLE",
                                    description: "SECTION_2_ROW_1_DESCRIPTION"
                                },
                                {
                                    id: "SECTION_2_ROW_2_ID",
                                    title: "SECTION_2_ROW_2_TITLE",
                                    description: "SECTION_2_ROW_2_DESCRIPTION"
                                }
                            ]
                        }
                    ]
                }
            }
            await provider.sendList(to, listParams)

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
