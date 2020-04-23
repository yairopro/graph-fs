const isDefined = require("./isDefined");

function toString(path){
    if (isDefined(path))
        return String(path);
}

module.exports = toString;
module.exports.default = toString;