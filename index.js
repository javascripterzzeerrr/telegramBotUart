const { SerialPort } = require('serialport');
const readLine = require('readline');
const fs = require('fs');
// const decoder = require('decoder');

let NEWDATA;

const decoder = (data) => {
    let decoderData = [];

    data.forEach(item => {
        if (String.fromCharCode(item) == '\n') return;
        decoderData.push(String.fromCharCode(item))
    });

    return decoderData.join("");
};

// Create a port
const port = new SerialPort({
    path: '/dev/ttyUSB0',
    baudRate: 115200,
});

port.write('main screen turn on', function(err) {
    if (err) {
        return console.log('Error on write: ', err.message);
    }
    console.log('Message written');
});

// Read data that is available but keep the stream in "paused mode"
// port.on('readable', function () {
//     console.log('Data from readable:', port.read().toJSON())
//     setTimeout(() => console.log("readable"),3000);
// })

// Switches the port into "flowing mode"
port.on('data', function (data) {
    return data;
})
    .then((data) => {
        return data.toJSON();
    })
    .then((writtenData) => {
       const date = (new Date()).toDateString();
        const dataDecoder = decoder(writtenData.data) + " " + date;
    })
    .then((dataDecoder) => {
        fs.appendFile("dataFromUart", dataDecoder, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("Файл успешно записан");
        });
    });

// Pipe the data into another stream (like a parser or standard out)
// const lineStream = port.pipe(new readLine())