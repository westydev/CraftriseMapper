function controlAndDelete(dizi, hedef) {
    const index = dizi.indexOf(hedef); 
    if (index !== -1) {
      dizi.splice(index, 1); 
      return {
        control: true,
        array: dizi
      }; 
    } else {
        return {
            control: false,
            array: dizi
        }; 
    }
}

function allValuesTrue(dizi) {
  for (let i = 0; i < dizi.length; i++) {
    if (dizi[i] !== true) {
      return false;
    }
  }
  return true;
}

function falseSayisiHesapla(dizi) {
  if (!Array.isArray(dizi)) {
    throw new Error('Parametre bir dizi olmalıdır.');
  }

  let falseSayisi = 0;

  for (let i = 0; i < dizi.length; i++) {
    if (dizi[i] === false) {
      falseSayisi++;
    }
  }

  return falseSayisi;
};

function siralaDizi(dizi) {
  dizi.sort(function(a, b) {
      var trueCountA = a.ResultArray.filter(Boolean).length;
      var trueCountB = b.ResultArray.filter(Boolean).length;

      return trueCountB - trueCountA;
  });

  return dizi;
}

function divideArrayIntoParts(array, partSize) {
  const dividedArrays = [];
  for (let i = 0; i < array.length; i += partSize) {
    const part = array.slice(i, i + partSize);
    dividedArrays.push(part);
  }
  return dividedArrays;
}

module.exports = { controlAndDelete, allValuesTrue, falseSayisiHesapla, siralaDizi, divideArrayIntoParts }