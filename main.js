const {
    JsonDatabase
} = require("wio.db");
const fs = require("fs")

const { Clazz } = require("./src/Java/Clazz");
const { Mapping } = require("./src/Mapper/Mapping");

const { listFilesInDirectory, fileListParseClassName, createFileNameClassNameMap } = require("./src/Utils/File");
const { getJavaByteCode } = require("./src/Utils/JByteCode");
const { divideArrayIntoParts } = require("./src/Utils/Array");



const db = new JsonDatabase({databasePath: "./clazzes.json" });

let classes = [];

async function LoadClassList(ClassList) {
    for (let index = 0; index < ClassList.length; index++) {
        const ClassData = ClassList[index];
        
        let byteCode = await getJavaByteCode(ClassData.file);

        let bclazz = new Clazz(
            ClassData.file,
            ClassData.className,
            byteCode
        );

        await bclazz.parse();

        classes.push(bclazz);

        bclazz.byteCode = null;

        db.push("classes", bclazz)

        console.log("Class Parsed: " + bclazz.className + " Parsed Classes Size: " + classes.length);
    }
};

function areEqualIgnoreCase(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}

async function CreateClassesData() {
    
    let DividedFilesList = divideArrayIntoParts(await createFileNameClassNameMap("./input"), 1000);

    for (let index = 0; index < DividedFilesList.length; index++) {
        const ClassList = DividedFilesList[index];
        LoadClassList(ClassList);
    }
};

async function printAndWriteMappings(Mappings) {
    console.log(Mappings);

    let MappingsContent = ``;

    for (let index = 0; index < Mappings.length; index++) {
        const mapping = Mappings[index];
        
        let MappingsString = mapping.vanilla + " -> " + mapping.craftrise;

        MappingsContent += MappingsString + `\n`;
    };

    await fs.writeFileSync("mappings.txt", MappingsContent, "utf8")
}

function classForName(classes, className) {
    let clazzS;

    for (let index = 0; index < classes.length; index++) {
        const clazz = classes[index];

        if(areEqualIgnoreCase(clazz.className, className)) {
            clazzS = clazz;
        }
    };

    return clazzS;
}

function hasMapping(Mappings, vanilla) {
    let result = false;

    for (let index = 0; index < Mappings.length; index++) {
        const mapping = Mappings[index];
        if(mapping.vanilla == vanilla) {
            result = true;
        }
    };

    return result;
};

function getMappingForName(mappings, vanilla) {
    let result = null;

    for (let index = 0; index < mappings.length; index++) {
        const mapping = mappings[index];
        
        if(mapping.vanilla == vanilla) {
            result = mapping;
        }
    };

    return result;
}

async function Main() {
    const clazzes = await db.get("classes") || [];
    let Mappings = [];

    if(clazzes == null || clazzes.length != (await createFileNameClassNameMap("./input")).length) {
        fs.unlinkSync("clazzes.json");

        new JsonDatabase({databasePath: "./clazzes.json" });

        CreateClassesData();
    } else if(clazzes.length == (await createFileNameClassNameMap("./input")).length) {
        console.log(" Starting Mapper");

        let ConfigClaz = await classForName(clazzes, "cr/launcher/Config");
        let ConfigClazz = new Clazz(ConfigClaz.file, ConfigClaz.className, ConfigClaz.byteCode, ConfigClaz.superClass, ConfigClaz.fields, ConfigClaz.voids, ConfigClaz.implementedClazz);

        let getMinecraftFunction = ConfigClazz.getVoidForName("getMinecraft");

        Mappings.push(new Mapping("net/minecraft/client/Minecraft", getMinecraftFunction.returnType.replaceAll(".", "/")));

       clazzes.forEach(ClazzData => {
        let clazzData = new Clazz(ClazzData.file, ClazzData.className, ClazzData.byteCode, ClazzData.superClass, ClazzData.fields, ClazzData.voids, ClazzData.implementedClazz);

        for (let index = 0; index < clazzData.fields.length; index++) {
            const field = clazzData.fields[index];

            if(field.name == "entity") {
               if(!hasMapping(Mappings, "net/minecraft/entity/Entity")) {
                   Mappings.push(new Mapping("net/minecraft/entity/Entity", field.type.replaceAll(".", "/")));
               }
            }
        }
       });

       clazzes.forEach(ClazzData => {
        let clazzData = new Clazz(ClazzData.file, ClazzData.className, ClazzData.byteCode, ClazzData.superClass, ClazzData.fields, ClazzData.voids, ClazzData.implementedClazz);

        for (let index = 0; index < clazzData.fields.length; index++) {
            const field = clazzData.fields[index];

            if(field.name.includes("networkmanager")) {
                if(!hasMapping(Mappings, "net/minecraft/network/NetworkManager")) {
                    Mappings.push(new Mapping("net/minecraft/network/NetworkManager", field.type.replaceAll(".", "/")));
                }
            }
        }
       });

       let NetworkManagerData = getMappingForName(Mappings, "net/minecraft/network/NetworkManager");
       let NetworkManagerClazz = await classForName(clazzes, NetworkManagerData.craftrise);

       if(NetworkManagerClazz) {
        let PacketClazzName = NetworkManagerClazz.superClass.replace("io.netty.channel.SimpleChannelInboundHandler<", "").replace(">", "");

        if(!hasMapping(Mappings, "net/minecraft/network/Packet")) {
            Mappings.push(new Mapping("net/minecraft/network/Packet", PacketClazzName.replaceAll(".", "/")));
        }
       };

       clazzes.forEach(ClazzData => {
        let clazzData = new Clazz(ClazzData.file, ClazzData.className, ClazzData.byteCode, ClazzData.superClass, ClazzData.fields, ClazzData.voids, ClazzData.implementedClazz);

        for (let index = 0; index < clazzData.fields.length; index++) {
            const field = clazzData.fields[index];

            if(field.name.includes("HANDSHAKING")) {
                if(!hasMapping(Mappings, "net/minecraft/network/EnumConnectionState")) {
                    Mappings.push(new Mapping("net/minecraft/network/EnumConnectionState", clazzData.className.replaceAll(".", "/")));
                }
            }
        }
       });

       clazzes.forEach(async ClazzData => {
        let clazzData = new Clazz(ClazzData.file, ClazzData.className, ClazzData.byteCode, ClazzData.superClass, ClazzData.fields, ClazzData.voids, ClazzData.implementedClazz);


        for (let index = 0; index < clazzData.fields.length; index++) {
            const Field = clazzData.fields[index];
            
            if(Field.name == "INTERACT_AT") {
                if(!hasMapping(Mappings, `net/minecraft/network/play/client/C02PacketUseEntity$Action`)) {
                    Mappings.push(new Mapping(`net/minecraft/network/play/client/C02PacketUseEntity$Action`, clazzData.className.replaceAll(".", "/")));

                    if(!hasMapping(Mappings, `net/minecraft/network/play/client/C02PacketUseEntity`)) {
                        let SplittedClazzName = clazzData.className.split("$");
    
                        let ClazzName = SplittedClazzName[0];

                        Mappings.push(new Mapping(`net/minecraft/network/play/client/C02PacketUseEntity`, ClazzName));

                        if(!hasMapping(Mappings, `net/minecraft/network/play/INetHandlerPlayServer`)) { 
                            for (let index = 0; index < clazzes.length; index++) {
                                const clazz = clazzes[index];

                                if(areEqualIgnoreCase(clazz.className, ClazzName)) {
                                    if(clazz.implementedClazz.includes(getMappingForName(Mappings, "net/minecraft/network/Packet").craftrise.replaceAll("/", "."))) {
                                        let C02PacketUseEntityImplements = clazz.implementedClazz;

                                        C02PacketUseEntityImplements = C02PacketUseEntityImplements.replace(getMappingForName(Mappings, "net/minecraft/network/Packet").craftrise.replaceAll("/", "."), "");

                                        C02PacketUseEntityImplements = C02PacketUseEntityImplements.replace("<", "").replace(">", "");

                                        Mappings.push(new Mapping(`net/minecraft/network/play/INetHandlerPlayServer`, C02PacketUseEntityImplements.replaceAll(".", "/")));
                                    }
                                }
                            }
                        };
                    }
                }
            }

            if(Field.name == "FAILED_DOWNLOAD") {
                if(!hasMapping(Mappings, `net/minecraft/network/play/client/C19PacketResourcePackStatus$Action`)) { 
                    Mappings.push(new Mapping(`net/minecraft/network/play/client/C19PacketResourcePackStatus$Action`, clazzData.className.replaceAll(".", "/")));

                    if(!hasMapping(Mappings, `net/minecraft/network/play/client/C19PacketResourcePackStatus`)) { 
                        let SplittedClazzName = clazzData.className.split("$");
    
                        let ClazzName = SplittedClazzName[0];

                        Mappings.push(new Mapping(`net/minecraft/network/play/client/C19PacketResourcePackStatus`, ClazzName));
                    }
                }
            }

            if(Field.name == "X_ROT") {
                if(!hasMapping(Mappings, `net/minecraft/network/play/server/S08PacketPlayerPosLook$EnumFlags`)) { 
                    Mappings.push(new Mapping(`net/minecraft/network/play/server/S08PacketPlayerPosLook$EnumFlags`, clazzData.className.replaceAll(".", "/")));

                    if(!hasMapping(Mappings, `net/minecraft/network/play/server/S08PacketPlayerPosLook`)) { 
                        let SplittedClazzName = clazzData.className.split("$");
    
                        let ClazzName = SplittedClazzName[0];

                        Mappings.push(new Mapping(`net/minecraft/network/play/server/S08PacketPlayerPosLook`, ClazzName));
                    }
                };
            }
        }
       });

       if(!hasMapping(Mappings, `net/minecraft/network/INetHandler`) && hasMapping(Mappings, "net/minecraft/network/play/INetHandlerPlayServer")) {
            let INetHandlerPlayServerClazz = classForName(clazzes, getMappingForName(Mappings, "net/minecraft/network/play/INetHandlerPlayServer").craftrise);
            let INetHandlerClazzName = INetHandlerPlayServerClazz.superClass;

            Mappings.push(new Mapping(`net/minecraft/network/INetHandler`, INetHandlerClazzName.replaceAll(".", "/")));
        };

        if(!hasMapping(Mappings, "net/minecraft/network/play/INetHandlerPlayClient")) {
            let S08PacketPlayerPosLookClazz = classForName(clazzes, getMappingForName(Mappings, "net/minecraft/network/play/server/S08PacketPlayerPosLook").craftrise);

            let INetHandlerPlayClientClazzName = S08PacketPlayerPosLookClazz.implementedClazz;

            INetHandlerPlayClientClazzName = INetHandlerPlayClientClazzName.replace(getMappingForName(Mappings, "net/minecraft/network/Packet").craftrise.replaceAll("/", "."), "");

            INetHandlerPlayClientClazzName = INetHandlerPlayClientClazzName.replace("<", "").replace(">", "");

            INetHandlerPlayClientClazzName = INetHandlerPlayClientClazzName.replaceAll(".", "/");

            Mappings.push(new Mapping("net/minecraft/network/play/INetHandlerPlayClient", INetHandlerPlayClientClazzName));
        }

        if(!hasMapping(Mappings, "net/minecraft/client/network/NetHandlerPlayClient")) {
            for (let index = 0; index < clazzes.length; index++) {
                const clazzData = clazzes[index];
                
                if(areEqualIgnoreCase(clazzData.implementedClazz, getMappingForName(Mappings, "net/minecraft/network/play/INetHandlerPlayClient").craftrise.replaceAll("/", "."))) {
                    let NetHandlerPlayClientClazzName = clazzData.className;

                    Mappings.push(new Mapping("net/minecraft/client/network/NetHandlerPlayClient", NetHandlerPlayClientClazzName));
                }
            }
        }

        if (!hasMapping(Mappings, "net/minecraft/world/WorldServer")) {
            let ConfigClaz = await classForName(clazzes, "cr/launcher/Config");

            for (let index = 0; index < ConfigClaz.voids.length; index++) {
                const v = ConfigClaz.voids[index];
                
                if(v.voidName == "getWorldServer") {
                    let WorldServerClazzName = v.returnType;
                    WorldServerClazzName = WorldServerClazzName.replaceAll(".", "/");

                    Mappings.push(new Mapping("net/minecraft/world/WorldServer", WorldServerClazzName));

                    let WorldServerClazz = await classForName(clazzes, WorldServerClazzName);

                    if (!hasMapping(Mappings, "net/minecraft/world/World")) { 
                        Mappings.push(new Mapping("net/minecraft/world/World", WorldServerClazz.superClass.replaceAll(".", "/")));
                    }
                }
            }
        }
        
        if(!hasMapping(Mappings, "net/minecraft/client/network/NetHandlerPlayClient.addToSendQueue")) {
            let NetHandlerPlayClientClazz = classForName(clazzes, getMappingForName(Mappings, "net/minecraft/client/network/NetHandlerPlayClient").craftrise);

            for (let index = 0; index < NetHandlerPlayClientClazz.voids.length; index++) {
                const JVoid = NetHandlerPlayClientClazz.voids[index];

                if(JVoid.returnType == "void" && JVoid.modifiers.includes("public")) {
                    let NetHandlerPlayClientClazzName = getMappingForName(Mappings, "net/minecraft/client/network/NetHandlerPlayClient").craftrise;

                    for (let index = 0; index < JVoid.params.length; index++) {
                        const param = JVoid.params[index];
                        
                        let ObfPacketClazzName = getMappingForName(Mappings, "net/minecraft/network/Packet").craftrise.replaceAll("/", ".");

                        if(areEqualIgnoreCase(param.type, ObfPacketClazzName)) {

                            let methodParams = "(";

                            for (let index = 0; index < JVoid.params.length; index++) {
                                const param = JVoid.params[index];
                                
                                if((JVoid.params.length - 1) == index) {
                                    if(areEqualIgnoreCase(param.type, ObfPacketClazzName)) {
                                        methodParams += param.type + " " + "packet";
                                    } else {
                                        methodParams += param.type + " " + param.type + index.toString();
                                    }
                                } else {
                                    if(areEqualIgnoreCase(param.type, ObfPacketClazzName)) {
                                        methodParams += param.type + " " + "packet, ";
                                    } else {
                                        methodParams += param.type + " " + param.type + index.toString();
                                    }
                                }
                            }

                            methodParams += ")";


                            let addToSendQueueMethod = NetHandlerPlayClientClazzName + "." + JVoid.voidName + methodParams;

                            Mappings.push(new Mapping("net/minecraft/client/network/NetHandlerPlayClient.addToSendQueue(net.minecraft.network.Packet packet)", addToSendQueueMethod));
                        }
                    }

                } 
            }
        }

       await printAndWriteMappings(Mappings)
    }
}

async function Test() {
    let byteCode = await getJavaByteCode("./input/com/craftrise/kF$a.class");
    let NetHandlerPlayClientClazz = new Clazz("./input/com/craftrise/kF$a", "com/craftrise/kF$a", byteCode);

    await NetHandlerPlayClientClazz.parse()

    console.log(NetHandlerPlayClientClazz.fields);
}

Main()