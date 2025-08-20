module.exports = (logger, [
    C_DEVICES,
    C_MDNS
]) => {

    // listen for mdns messages
    // add new device if not allread done
    C_MDNS.found({
        name: "wled-*.local",
        type: "A"
    }, (record) => {

        record.match(async ({ data, name }) => {

            let exists = await C_DEVICES.find({
                interfaces: [{
                    settings: {
                        host: data,
                        port: 80
                    }
                }]
            });

            if (exists) {
                return logger.verbose(`Device with ip/host ${data} allready exists`);
            }

            let device = await C_DEVICES.add({
                name,
                interfaces: [{
                    settings: {
                        host: data,
                        port: 80
                    }
                }],
                labels: [
                    "wled=true",
                    `name=${name}`
                ]
            });

            logger.info(`Device "${device.name}" added`, device);

        });

    }, async (filter) => {
        try {

            let record = await C_MDNS.add(filter);
            logger.verbose(`mdns recourd added`, record);

        } catch (err) {

            logger.error("Could not add mdns record", err);

        }
    });

};