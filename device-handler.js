const request = require("../../helper/request.js");


module.exports = (logger, [
    C_DEVICES,
    C_ENDPOINTS
]) => {

    C_DEVICES.found({
        labels: [
            "wled=true",
            //"name=*" // does not work, see: https://github.com/OpenHausIO/backend/issues/527
        ]
    }, (device) => {

        let iface = device.interfaces[0];
        let { host, port } = iface.settings;
        let agent = iface.httpAgent();

        // fetch effects
        // add endpoint

        // color
        // effect speed
        // saturation


        C_ENDPOINTS.found({
            device: device._id
        }, (endpoint) => {

            // do nothing
            // TODO: try to add `null`/`undefined` instead of callback

        }, async (query) => {


            const EFFECTS = [{
                name: "Off",
                alias: "OFF",
                interface: iface._id
            }, {
                name: "Color",
                alias: "COLOR",
                interface: iface._id,
                params: [{
                    type: "number",
                    key: "color",
                    min: 0,
                    max: 360,
                    classes: ["hue-fader"]
                }, {
                    type: "number",
                    key: "brightness",
                    min: 0,
                    max: 100,
                    value: 100,
                    classes: ["brightness-fader"]
                }/*, {
                    type: "number",
                    key: "r",
                    min: 0,
                    max: 255,
                    value: 128
                }, {
                    type: "number",
                    key: "g",
                    min: 0,
                    max: 255,
                    value: 128
                }, {
                    type: "number",
                    key: "b",
                    min: 0,
                    max: 255,
                    value: 128
                }*/]
            }, {
                name: "Colorloop",
                interface: iface._id,
                alias: "8", // chat gpt says 37, but its not
                params: [{
                    type: "number",
                    key: "speed",
                    min: 0,
                    max: 255,
                    value: 128
                }, {
                    type: "number",
                    key: "saturation",
                    min: 0,
                    max: 255,
                    value: 255,
                    classes: ["saturation-fader"]
                }]
            }, {
                name: "Solid",
                interface: iface._id,
                alias: "0"
            }, {
                name: "Candle",
                interface: iface._id,
                alias: "88",
                params: [{
                    type: "number",
                    key: "speed",
                    min: 0,
                    max: 255,
                    value: 128
                }, {
                    type: "number",
                    key: "intensity",
                    min: 0,
                    max: 255,
                    value: 128
                }]
            }, {
                name: "Wecker",
                alias: "0",
                interface: iface._id,
                params: [{
                    type: "number",
                    key: "transition",
                    min: 1,
                    max: 1000,
                    value: 100
                }]
            }];


            let response = await request(`http://${host}:${port}/json/eff`, {
                agent
            });

            logger.debug("Fetched effects", response.body);

            response.body.forEach((name, index) => {

                EFFECTS.push({
                    name,
                    alias: `${index}`,
                    interface: iface._id
                });

            });

            let endpoint = await C_ENDPOINTS.add({
                ...query,
                name: device.name,
                commands: EFFECTS
            });

            logger.info(`Endpoint ${endpoint.name} added`, endpoint);;

        });


    });

};