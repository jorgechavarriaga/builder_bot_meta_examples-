import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008

const option1 = `Canada \uD83C\uDDE8\uD83C\uDDE6`
const option2 = `Colombia \uD83C\uDDE8\uD83C\uDDF4`
const option3 = `USA \uD83C\uDDFA\uD83C\uDDF8`

const buttonsList = [
    { body: option1 },
    { body: option2 },
    { body: option3 },
]

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer('Please select your country', { buttons: buttonsList })
    .addAction(
        { capture: true },
        async (ctx, { fallBack, endFlow, state }) => {
            const attempts = state.get('attempts') || 1;
            const resp = ctx.title_button_reply;
            if (resp !== option1 && resp !== option2 && resp !== option3) {
                if (attempts < 4) {
                    await state.update({ attempts: attempts + 1 });
                    return fallBack(`\u274C Wrong option! Please select one of the 3 options.\nAttempt ${attempts} of 3`);
                } else {
                    await state.update({ attempts: 1 });
                    return endFlow(`\u274C Too many attempts. Bot ended.`);
                }
            } else {
                await state.update({ country: resp });
            }
        }
    )
    .addAction(
        async (_, { flowDynamic, state }) => {
            const country = state.get('country')
            await flowDynamic(`You have selected ${country}`)
        }
    )
    .addAction(
        async (_, { endFlow, globalState }) => {
            await globalState.update({ counter: 0 })
            return endFlow('Chat ended!')
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
