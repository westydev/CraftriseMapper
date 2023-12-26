const fs = require('fs');
const path = require('path');

const { Clazz } = require("../Java/Clazz")

function listFilesInDirectory(directoryPath, fileList = []) {
  const files = fs.readdirSync(directoryPath);

  files.forEach((file) => {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      listFilesInDirectory(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });

  return fileList;
};

async function fileListParseClassName(path) {
  const files = await listFilesInDirectory('./input');

  let classes = [];

  for (let i = 0; i < files.length; i++) {
    let fileName = files[i];

    let className = "";

    className = fileName.replaceAll("\\", "/").replaceAll(path.replaceAll("./", ""), "").replaceAll(".class", "");

    className = className.substring(1);

    classes.push(className)
  }

  return classes;
};

async function createFileNameClassNameMap(path) {
  let files = listFilesInDirectory(path);
  let classes = await fileListParseClassName(path);


  let map = [];
  
  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    
    map.push(
      new Clazz(file, classes[index], null)
    )
  };

  return map;
}

module.exports = { listFilesInDirectory, fileListParseClassName, createFileNameClassNameMap }