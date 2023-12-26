const util = require('util');
const exec = util.promisify(require('child_process').exec);

async function getJavaByteCode(file) {
  const command = `javap -c ${file}`;

  try {
    const { stdout, stderr } = await exec(command);

    if (stderr) {
      console.error(`Standart hata çıktısı: ${stderr}`);
      throw new Error(stderr);
    }

    return stdout;
  } catch (error) {
    console.error(`Hata oluştu: ${error}`);
    throw error;
  }
}

module.exports = { getJavaByteCode }