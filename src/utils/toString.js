const {isNil} = require("ramda");

function toString(path){
    if (!isNil(path))
        return String(path);
}

module.exports = toString;
module.exports.default = toString;