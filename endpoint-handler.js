const { WebSocket } = require("ws");

const infinity = require("../../helper/infinity.js");
const debounce = require("../../helper/debounce.js");
const request = require("../../helper/request.js");


module.exports = (logger, [
    C_DEVICES,
    C_ENDPOINTS
]) => {

    C_DEVICES.found({
        labels: [
            "wled=true",
            //"name=*" // does not work, see https://github.com/OpenHausIO/backend/issues/527
        ]
    }, (device) => {

        C_ENDPOINTS.found({
            device: device._id
        }, (endpoint) => {

            let worker = debounce((redo) => {

                logger.debug("Init handling logic");

                let iface = device.interfaces[0]
                let { host, port } = iface.settings;
                let agent = iface.httpAgent();

                let interval = null;

                request(`http://${host}:${port}/json`, {
                    //agent
                }, (err, result) => {

                    console.log(err || result.body)

                });


                let ws = new WebSocket(`ws://${host}:${port}/ws`, {
                    agent
                });

                ws.once("error", (err) => {

                    // clear healthechek interval
                    clearInterval(interval);

                    // feedback
                    logger.warn(err, `Could not connect to to WebSocket ${ws.url}`);

                    // re init
                    redo();

                });

                ws.once("close", () => {

                    // clear healthechek interval
                    clearInterval(interval);

                    // feedback
                    logger.warn(`WebSocket connection closed from ${ws.url}`);

                    // re init
                    redo();

                });

                ws.once("open", () => {

                    // feedback
                    logger.info(`WebSocket connected to ${ws.url}`);

                    // check connection interval
                    // if no pong is received, tv is truned off while connected
                    interval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {

                            // feedback
                            logger.verbose(`Send WebSocket ping to ${host}`);

                            ws.ping();

                            let timer = setTimeout(() => {

                                // feedback
                                logger.error(`Websocket ping/pong timeout for host "${host}"`);

                                ws.close();
                                ws.terminate();

                            }, 1000);

                            ws.once("pong", () => {

                                // feedback
                                logger.verbose(`Websocket pong received from ${host}`);

                                clearTimeout(timer);

                            });

                        }
                    }, 10000);

                });

                ws.on("message", (json) => {
                    try {

                        json = JSON.parse(json?.toString());
                        logger.verbose("WebSocket message received", json);

                    } catch (err) {

                        logger.warn(err, `Could not parse JSON message from ${ws.url}`)

                    }
                });

                let obj = {
                    on: true,
                    bri: 255,
                    seg: [{
                        fx: 0
                    }],
                    //v: false does not work via WS API
                };

                endpoint.commands.forEach((command) => {
                    command.setHandler((cmd, iface, params, done) => {

                        // override array, with lean object
                        params = params.lean();

                        // default value for command
                        // turn on on every command 
                        obj.on = true;
                        obj.transition = 10;


                        // override `.on`
                        if (cmd.alias === "OFF") {

                            obj.on = false;
                            //obj.seg[0].fx = 0;

                        } else if (cmd.alias === "COLOR") {

                            obj.bri = Number(params.brightness || 255);

                            obj.seg[0].col = [
                                [
                                    Number(params.r),
                                    Number(params.g),
                                    Number(params.b)
                                ]
                            ];

                        } else {

                            // off & color are not commands per se
                            // they set values for the effects below
                            // ignore fx setting, keep value
                            // set fx value only if not off/color "command"
                            obj.seg[0].fx = Number(cmd.alias);

                        }


                        if (cmd.name === "Colorloop") {

                            Object.assign(obj.seg[0], {
                                sx: Number(params?.speed || 255),
                                ix: Number(params?.saturation || 255)
                            });

                        } else if (cmd.name === "Candle") {

                            Object.assign(obj.seg[0], {
                                sx: Number(params?.speed || 255),
                                ix: Number(params?.intensity || 255)
                            });

                        } else if (cmd.name === "Wecker") {

                            obj.transition = Number(params?.transition || 1000);

                            Object.assign(obj.seg[0], {
                                fx: 0,
                                sx: 0,
                                ix: 255,
                                col: [
                                    //["246", "192", "80"] // why in quotes?!
                                    [246, 192, 80]
                                ]
                            });

                        }

                        logger.debug("command object to send:", obj, obj.seg[0]);


                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify(obj), (err) => {
                                if (err) {

                                    logger.error(err, `Could not send ws message to websocket on ${ws.url}`);

                                    done(err);

                                } else {

                                    ws.once("message", (json) => {
                                        json = JSON.parse(json?.toString());
                                        done(null, json.state.on === true);
                                    });

                                }
                            });
                        } else {

                            // feedback
                            logger.warn(`WebSocket not connected, could not send command "${cmd.name}", ws.readyState=${ws.readyState}`);

                        }

                    });
                });

            }, 1000);

            infinity(worker, 5000);

        });

    });

};