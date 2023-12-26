const { Field } = require("./Field");
const { Void } = require("./Void");
const { VoidParam } = require("./VoidParam");

function getSubstringUntilCharacter(inputString, targetCharacter) {
    const index = inputString.indexOf(targetCharacter);

    if (index === -1 || index === 0) {
        return "";
    }

    const result = inputString.substring(0, index);

    return result;
}

function getSubstringStartingFromCharacter(inputString, targetCharacter) {
    const index = inputString.indexOf(targetCharacter);

    if (index === -1 || index === 0) {
        return "";
    }

    const result = inputString.substring(index);

    return result;
}

class Clazz {
    constructor(file, name, byteCode, superClass, fields, voids, implementedClazz) {
        this.file = file
        this.className = name
        this.byteCode = byteCode
        this.superClass = superClass || ""
        this.fields = fields || []
        this.voids = voids || []
        this.implementedClazz = implementedClazz || ""
    }

    getVoidForName(name) {
        for (let index = 0; index < this.voids.length; index++) {
            const voiD = this.voids[index];
            if(voiD.voidName == name) {
                return voiD;
            }
        }
    }

    async parseSuperClazz() {
        let lines = this.byteCode.split("\n");

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            
            if((line.includes("class") || line.includes("enum") || line.includes("interface")) && line.includes("{")) {
                if(line.includes("extends")) {
                let words = line.split(" ");

                for (let index = 0; index < words.length; index++) {
                    const word = words[index];
                    
                    if(word == "extends") {
                        this.superClass = words[index + 1];
                    }
                }
            }
           }
        };
    };

    async parseImplementedClazz() {
        let lines = this.byteCode.split("\n");

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            
           if((line.includes("class") || line.includes("enum") || line.includes("interface")) && line.includes("{")) {
            if(line.includes("implements")) {
                let words = line.split(" ");

                for (let index = 0; index < words.length; index++) {
                    const word = words[index];
                    
                    if(word == "implements") {
                        this.implementedClazz = words[index + 1];
                    }
                }
            }
           }
        };
    };

    async parseFields() {
        let lines = this.byteCode.split("\n");

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];

            let modifiers = [];
            let name = "";
            let type = "";

            if(((line.includes("public") || line.includes("private") || line.includes("protected") || line.includes("final") || line.includes("static")) && line.includes(";")) && !line.includes("Method") &&  !line.includes(":") && !line.includes("{};") && (!line.includes("(") || !line.includes(")"))) {
                let words = line.split(" ");
                let deletedLine = line;

                for (let index = 0; index < words.length; index++) {
                    const key = words[index];                    
                    
                    if(key.includes("public") || key.includes("private") ||key.includes("protected") || key.includes("final") || key.includes("static")) {
                        modifiers.push(key);

                        deletedLine = deletedLine.replaceAll(key, "");
                    }
                };

                let nonModifiersLineKeys = deletedLine.trim().split(" ");

                type = nonModifiersLineKeys[0];
                name = nonModifiersLineKeys[1].replaceAll(";", "");

                this.fields.push(new Field(modifiers, type, name, line.trim().replaceAll(`\r`, "")));

                //console.log(`\nLine: ${line}\nModifiers: ${modifiers}\nParsedNonModiferLine: ${deletedLine.trim()}\nType: ${type}\nName: ${name}`);
            };
        };
    }

    async parseMethods() {
        let lines = this.byteCode.split("\n");

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];

            let modifiers = [];
            let name = "";
            let returnType = "";
            let params = []

            if((line.includes("public") || line.includes("private") || line.includes("protected") || line.includes("final") || line.includes("static"))) {
                let deletedLine = line;

                if(line.includes("(") && line.includes(")") && !line.includes("//")) {
                    let keys = line.split(" ");

                    for (let index = 0; index < keys.length; index++) {
                        const key = keys[index];
                        
                        if(key.includes("public") || key.includes("private") ||key.includes("protected") || key.includes("final") || key.includes("static")) {
                            modifiers.push(key);
    
                            deletedLine = deletedLine.replaceAll(key, "");
                        }
                    }

                    let vv1 = getSubstringUntilCharacter(deletedLine, "(")
                    let deletedSplit = vv1.trim().split(" ");

                    if(deletedSplit[0] == "void") {
                        returnType = "void"
                    } else {
                        returnType = deletedSplit[0]
                    };

                   //if(deletedSplit.length != 2) return;

                   try {
                        if(deletedSplit[1]) {
                            let voidNameAndObject = deletedSplit[1].trim()

                            let voidNameAndObjectSplitted = voidNameAndObject.split(" ");

                            name = voidNameAndObjectSplitted[0];

                            let v1 = getSubstringStartingFromCharacter(deletedLine, "(");
                            v1 = v1.replace(";", "");
                            v1 = v1.replace("(", "");
                            v1 = v1.replace(")", "");
                            v1 = v1.trim()

                            v1 = v1.split(",");

                            for (let index = 0; index < v1.length; index++) {
                                const param = v1[index];
                                
                                params.push(new VoidParam(param.trim()));
                            }

                        } else if(deletedSplit.length == 1) {
                            returnType = "constructor"
                            name = "<init>";

                            let v1 = getSubstringStartingFromCharacter(deletedLine, "(");
                            v1 = v1.replace(";", "");
                            v1 = v1.replace("(", "");
                            v1 = v1.replace(")", "");
                            v1 = v1.trim()

                            v1 = v1.split(",");

                            for (let index = 0; index < v1.length; index++) {
                                const param = v1[index];
                                
                                params.push(new VoidParam(param.trim()));
                            }
                        }


                    this.voids.push(new Void(modifiers, name, returnType, line.trim().replaceAll(`\r`, ""), params))
                   } catch (error) {
                    console.log(error);
                   }
                }
            }
        }
    }


    async parse() {
        await this.parseSuperClazz();
        await this.parseImplementedClazz();
        await this.parseFields();
        await this.parseMethods()
    }
}

module.exports = { Clazz }