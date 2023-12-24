module.exports.decoder = (data) => {
    let decoderData = [];

    data.forEach(item => {
        decoderData.push(String.fromCharCode(item))
    });

    return decoderData;
};