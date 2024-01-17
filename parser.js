const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const fs = require('fs');
const path = require('path');
const getLastLine = require('./lastLineTool.js').getLastLine

require('dotenv').config();

const minLineLength = 1

let filePathLast = null;
let filePath = null;

const listFile = [];

let { Telegraf }= require('telegraf');
let { message }= require('telegraf/filters');

const bot = new Telegraf(process.env.TOKEN);

bot.start(async (ctx) => {
    await ctx.telegram.sendMessage(ctx.chat.id, 'Добро пожаловать в бот для мониторинга данных с датчика', {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'last data', callback_data: "LAST"},
                    {text: 'all data', callback_data: "ALL"},
                    {text: 'turn on relay', callback_data: 'Turn on relay'},
                    {text: 'turn off relay', callback_data: 'Turn off relay'}
                ],
            ]
        }
    })
});

bot.action('ALL', async (ctx) => {
    ctx.deleteMessage();

    if (filePath != null) {
        const fileData = fs.readFileSync(filePath);
        await ctx.telegram.sendMessage(ctx.chat.id, 'Date => ' + fileData);
    }
    else {
        await ctx.telegram.sendMessage(ctx.chat.id, 'Данных еще нет, попробуйте подождать');
    }

    await ctx.telegram.sendMessage(ctx.chat.id, 'Новые данные', {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'last data', callback_data: "LAST"},
                    {text: 'all data', callback_data: "ALL"},
                    {text: 'turn on relay', callback_data: 'Turn on relay'},
                    {text: 'turn off relay', callback_data: 'Turn off relay'}
                ],
            ]
        }
    });
});

bot.action('LAST', async (ctx) => {
    ctx.deleteMessage();
    let fileDataLastLine = null;

    if (filePath != null) {
        getLastLine(filePath, 1)
            .then((lastLine)=> {
                console.log("!!!!!!!!!!!! last line => ", lastLine);
                fileDataLastLine = lastLine;
                return fileDataLastLine;
            })
            .then((fileDataLastLine) => {
                if (fileDataLastLine == null) fileDataLastLine = "Не удалось считать данные(";
                ctx.telegram.sendMessage(ctx.chat.id, 'Date => ' + fileDataLastLine);
            })
            .catch((err)=> {
                console.error(err)
            })
    }
    else {
        await ctx.telegram.sendMessage(ctx.chat.id, 'Данных еще нет, попробуйте подождать');
    }

    await ctx.telegram.sendMessage(ctx.chat.id, 'Новые данные', {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'last data', callback_data: "LAST"},
                    {text: 'all data', callback_data: "ALL"},
                    {text: 'turn on relay', callback_data: 'Turn on relay'},
                    {text: 'turn off relay', callback_data: 'Turn off relay'}
                ],
            ]
        }
    });
});

bot.action('Turn on relay', async (ctx) => {
    ctx.deleteMessage();

    port.write("1");
    console.log("!!!!!!!!!!!!!!!!!!!Write was sended 1!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    await ctx.telegram.sendMessage(ctx.chat.id, 'Новые данные', {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'last data', callback_data: "LAST"},
                    {text: 'all data', callback_data: "ALL"},
                    {text: 'turn on relay', callback_data: 'Turn on relay'},
                    {text: 'turn off relay', callback_data: 'Turn off relay'}
                ],
            ]
        }
    });
});

bot.action('Turn off relay', async (ctx) => {
    ctx.deleteMessage();

    port.write("0");
    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!Write was sended 0!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");

    await ctx.telegram.sendMessage(ctx.chat.id, 'Новые данные', {
        reply_markup: {
            inline_keyboard: [
                [
                    {text: 'last data', callback_data: "LAST"},
                    {text: 'all data', callback_data: "ALL"},
                    {text: 'turn on relay', callback_data: 'Turn on relay'},
                    {text: 'turn off relay', callback_data: 'Turn off relay'}
                ],
            ]
        }
    });
})

bot.command('quit', async (ctx) => {
    // Explicit usage
    await ctx.telegram.leaveChat(ctx.message.chat.id)

    // Using context shortcut
    await ctx.leaveChat()
});

// bot.on(message('text'), async (ctx) => {
//     if (filePath != null) {
//         const fileData = fs.readFileSync(filePath);
//         await ctx.telegram.sendMessage(ctx.message.chat.id, 'Date => ' + fileData);
//     }
// });

bot.on('callback_query', async (ctx) => {
    // Explicit usage
    await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

    // Using context shortcut
    await ctx.answerCbQuery()
});

bot.on('inline_query', async (ctx) => {
    const result = []
    // Explicit usage
    await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

    // Using context shortcut
    await ctx.answerInlineQuery(result)
});

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

let timmedDataLast = null;

const port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 115200,
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n'}));

// Use the Readline parser
// const parser = port.pipe(new Readline({ delimiter: '' }));
// Parse and process data received from the serial port
parser.on('data', (data) => {
    if (timmedDataLast && timmedDataLast == data) {
        return;
    }

    console.log("!!!!!!!!!!!!!!!!DATA => ", data);

    // let myReg = new RegExp("/\\d+(\\.\\d+)?/", "gi");
    //
    // const humidity = myReg.exec(data);

    const humidity = data.slice(11, 16);
    console.log("!!!!!!!!!!! HUM => ", humidity);

    const temperature = data.slice(25, data.length);
    console.log("!!!!!!!!!!! TEMP => ", temperature);

    console.log("typeof humidity => ", typeof humidity);

    // if (humidity) {
    //     if (Number(humidity) > 70) {
    //         port.write("1");
    //         console.log("Write was sended 1");
    //     }
    //     else {
    //         port.write("0");
    //         console.log("Write was sended 0");
    //     }
    // }

    timmedDataLast = data;

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth();
    const datOfMonth = date.getDate();
    const hour = date.getHours();
    const min = date.getMinutes();
    const sec = date.getSeconds();

    const dateString = date.toString();
    const trimmedData = date + " " + data.trim();
    console.log('Received data:', trimmedData);

    filePath = `dataFromUart${year}_${month}_${datOfMonth}_${hour}`;
    console.log("File path is ", filePath);

    if (filePath !== filePathLast) listFile.push(filePathLast);

    fs.appendFile(filePath, (trimmedData + '\n'), function (err) {
        if (err) {
            return console.log(err);
        }

        filePathLast = filePath;
        return console.log("Файл успешно записан");
    });
});

// setTimeout(() => {
//     for (file of filePathLast) {
//         fs.unlink(file, (err) => {
//             if (err) console.log(err);
//             // если возникла ошибка
//             else console.log(`${file} was deleted`);
//         });
//     }
// }, 10000);