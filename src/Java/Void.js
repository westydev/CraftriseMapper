class Void {
    constructor(modifiers, voidName, returnType, line, params) {
        this.voidName = voidName;
        this.modifiers = modifiers;
        this.returnType = returnType;
        this.line = line;
        this.params = params || []
    }
}

module.exports = { Void }