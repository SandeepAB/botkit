const { Botkit } = require('botkit');
const axios = require('axios');
const { WebAdapter } = require('botbuilder-adapter-web');
const { TyntecWhatsAppAdapter } =  require('./botbuilder-adapter-tyntec-whatsapp');
const { APIAdapter } =  require('./custom-api-adapter');

require('dotenv').config();
let storage = null;
const web_adapter = new WebAdapter({});

const axiosInstance = axios.create();

const whatsapp_adapter = new TyntecWhatsAppAdapter({
    axiosInstance,
    tyntecApikey: 'API_KEY'
});

const api_adapter = new APIAdapter({
    axiosInstance,
    tyntecApikey: 'API_KEY',
    url: "http://localhost:3000/conversations/v3/messages"
});

const controller = new Botkit({
    webhook_uri: '/api/messages',
    webserver_middlewares: [(req, res, next) => { 
        console.log('REQ > ', req.body); 
        next(); 
    }],
    storage
});

controller.ready(() => {
    controller.loadModules(__dirname + '/features');

    controller.publicFolder('/api/web',__dirname  + '/public');
    web_adapter.createSocketServer(controller.http, {}, controller.handleTurn.bind(controller));


    controller.webserver.post('/api/whatsapp', (req, res) => {
        whatsapp_adapter.processActivity(req, res, controller.handleTurn.bind(controller)).catch((err) => {
            console.error('Experienced an error inside the turn handler', err);
            throw err;
        });
    });

    controller.webserver.post('/api/test', (req, res) => {
        api_adapter.processActivity(req, res, controller.handleTurn.bind(controller)).catch((err) => {
            console.error('Experienced an error inside the turn handler', err);
            throw err;
        });
    });

    controller.on('message', async (bot, message) => {
        const adapter_type = bot.getConfig('context').adapter.name;
        await bot.reply(message,`I heard ya on my ${ adapter_type } adapter`);
    });

});

controller.webserver.get('/', (req, res) => {
    res.send(`This app is running Botkit ${ controller.version }.`);
});

controller.webserver.post('/conversations/v3/messages', (req, res) => {
    res.statusCode = 202;
    res.send(req.body);
});