import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { MetaProvider as Provider } from '@builderbot/provider-meta'
import { config } from 'dotenv'
config()

const PORT = process.env.PORT ?? 3008

const contacts = [
    {
        addresses: [{
            street: "852 Rue Marie-Gérin-Lajoie",
            city: "Terrebonne",
            state: "Quebec",
            zip: "J6Y 0L5",
            country: "Canada",
            country_code: "CA",
            type: "HOME"
        },
        {
            street: "4468 Wellington St Suite 204",
            city: "Verdun",
            state: "Quebec",
            zip: "H4G 1W5",
            country: "Canada",
            country_code: "CA",
            type: "WORK"
        }],
        birthday: "1972-05-25",
        emails: [{
            email: "jorge.chavarriaga@chavazystem.tech",
            type: "WORK"
        },
        {
            email: "jorge.chavarriaga@gmail.com",
            type: "HOME"
        }],
        name: {
            formatted_name: "Jorge Chavarriaga",
            first_name: "Jorge",
            last_name: "Chavarriaga",
            middle_name: "",
            suffix: "",
            prefix: ""
        },
        org: {
            company: "ChavaZystem Tech",
            department: "IT",
            title: "Full Stack Developer"
        },
        phones: [{
            phone: "1418321XXXX",
            type: "HOME"
        },
        {
            phone: "1418321ZZZZ",
            type: "WORK",
            wa_id: "1418321YYYY"
        }],
        urls: [{
            url: "https://www.chavazystem.tech",
            type: "WORK"
        },
        {
            url: "https://www.chavazystem.tech",
            type: "HOME"
        }]
    },
    {
        addresses: [{
            street: "852 Rue Marie-Gérin-Lajoie",
            city: "Terrebonne",
            state: "Quebec",
            zip: "J6Y 0L5",
            country: "Canada",
            country_code: "CA",
            type: "HOME"
        },
        {
            street: "4468 Wellington St Suite 204",
            city: "Verdun",
            state: "Quebec",
            zip: "H4G 1W5",
            country: "Canada",
            country_code: "CA",
            type: "WORK"
        }],
        birthday: "1972-05-25",
        emails: [{
            email: "jorge.chavarriaga@chavazystem.tech",
            type: "WORK"
        },
        {
            email: "jorge.chavarriaga@gmail.com",
            type: "HOME"
        }],
        name: {
            formatted_name: "Jorge Chavarriaga",
            first_name: "Jorge",
            last_name: "Chavarriaga",
            middle_name: "",
            suffix: "",
            prefix: ""
        },
        org: {
            company: "ChavaZystem Tech",
            department: "IT",
            title: "Full Stack Developer"
        },
        phones: [{
            phone: "1418321XXXX",
            type: "HOME"
        },
        {
            phone: "1418321ZZZZ",
            type: "WORK",
            wa_id: "1418321YYYY"
        }],
        urls: [{
            url: "https://www.chavazystem.tech",
            type: "WORK"
        },
        {
            url: "https://www.chavazystem.tech",
            type: "HOME"
        }]
    }
]


const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAction(
        async (ctx, { flowDynamic, provider }) => {
            const to = ctx.from
            await flowDynamic('\u{1F4A1} Send Contacts:')
            await provider.sendContacts(to, contacts)
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
