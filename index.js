module.exports = (info, logger, init) => {
    return init([
        "devices",
        "endpoints",
        "mdns"
    ], (scope, [
        C_DEVICES,
        C_ENDPOINTS,
        C_MDNS
    ]) => {

        require("./autodiscover.js")(logger, [
            C_DEVICES,
            C_MDNS
        ]);

        require("./device-handler.js")(logger, [
            C_DEVICES,
            C_ENDPOINTS
        ]);

        require("./endpoint-handler.js")(logger, [
            C_DEVICES,
            C_ENDPOINTS
        ]);

    });
};