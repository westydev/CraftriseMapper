class Field {
    constructor(modifiers, type, name, fieldLine) {
        this.modifiers = modifiers
        this.type = type
        this.name = name
        this.fieldLine = fieldLine;
    }

    isFinal() {
        if(this.modifiers.includes("final")) {
            return true
        } else {
            return false;
        }
    }

    isStatic() {
        if(this.modifiers.includes("static")) {
            return true
        } else {
            return false;
        }
    }

    isPublic() {
        if(this.modifiers.includes("public")) {
            return true
        } else {
            return false;
        }
    }

    isPrivate() {
        if(this.modifiers.includes("private")) {
            return true
        } else {
            return false;
        }
    }
}

module.exports = { Field };