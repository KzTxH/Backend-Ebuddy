const ProductTypeSetting = require('../models/ProductTypeSetting');


function isValidFormat(input) {
    const regex = /[a-zA-Z\s]+\|[a-zA-Z0-9\s.]+\|https?:\/\/[^\s]+\|[0-9.]+/gm;
    return regex.test(input);
  }


// Save AI settings
exports.saveSettings = async (req, res) => {
  const {
    productType,
    category,
    brand,
    productDescription,
    identifierCodeType,
    identifierCode,
    colorTypeVariantimagePrice,
    packageWeight,
    packageLength,
    packageWidth,
    packageHeight,
    deliveryOptions,
    quantityinALEASEWILLIS,
    quantityinCORNELLHODGES,
    sizeChart,
    material,
    pattern,
    neckline,
    clothingLength,
    sleeveLength,
    season,
    occasion,
    style,
    feature,
    shape,
    scent,
    setting,
    use,
    installment,
    fit,
    stretch,
    careInstructions,
    waistHeight,
    volume,
    magnets,
    manufacturingTechnique,
    ageGroup,
    battery,
    bPAFree,
    otherDangerousGoodsorHazardousMaterials,
    cAProp65Carcinogens,
    carcinogen,
    cAProp65ReproChems,
    reprotoxicChemicals,
    containsBatteriesorCells,
    batteryType,
    howBatteriesArePacked,
    numberofBatteriesorcells,
    batteryorCellCapacityinWh,
    batteryorCellCapacityingrams,
    batteryorCellWeightingrams,
    flammableLiquid,
    flammableLiquidVolumeinml,
    aerosols,
    aerosolLiquidVolumeinml,
    safetyDataSheetforflammablematerials,
    safetyDataSheetforproductswithbatteries,
    safetyDataSheetforaerosolproducts,
    safetyDataSheetforotherdangerousgoodsorhazardousmaterials,
  } = req.body;

  console.log(colorTypeVariantimagePrice)
  console.log(isValidFormat(colorTypeVariantimagePrice))
  if (!isValidFormat(colorTypeVariantimagePrice)) {
    return res.status(400).send('Bạn Đã Nhập Sai Định Dạng');
  }

  try {
    const newSetting = new ProductTypeSetting({
      productType,
      category,
      brand,
      productDescription,
      identifierCodeType,
      identifierCode,
      colorTypeVariantimagePrice,
      packageWeight,
      packageLength,
      packageWidth,
      packageHeight,
      deliveryOptions,
      quantityinALEASEWILLIS,
      quantityinCORNELLHODGES,
      sizeChart,
      material,
      pattern,
      neckline,
      clothingLength,
      sleeveLength,
      season,
      occasion,
      style,
      feature,
      shape,
      scent,
      setting,
      use,
      installment,
      fit,
      stretch,
      careInstructions,
      waistHeight,
      volume,
      magnets,
      manufacturingTechnique,
      ageGroup,
      battery,
      bPAFree,
      otherDangerousGoodsorHazardousMaterials,
      cAProp65Carcinogens,
      carcinogen,
      cAProp65ReproChems,
      reprotoxicChemicals,
      containsBatteriesorCells,
      batteryType,
      howBatteriesArePacked,
      numberofBatteriesorcells,
      batteryorCellCapacityinWh,
      batteryorCellCapacityingrams,
      batteryorCellWeightingrams,
      flammableLiquid,
      flammableLiquidVolumeinml,
      aerosols,
      aerosolLiquidVolumeinml,
      safetyDataSheetforflammablematerials,
      safetyDataSheetforproductswithbatteries,
      safetyDataSheetforaerosolproducts,
      safetyDataSheetforotherdangerousgoodsorhazardousmaterials,
    });

    const savedSetting = await newSetting.save();
    res.json(savedSetting);

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Get all AI settings
exports.getAllSettings = async (req, res) => {
  try {
    const settings = await ProductTypeSetting.find();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update AI settings
exports.updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productType,
      category,
      brand,
      productDescription,
      identifierCodeType,
      identifierCode,
      colorTypeVariantimagePrice,
      packageWeight,
      packageLength,
      packageWidth,
      packageHeight,
      deliveryOptions,
      quantityinALEASEWILLIS,
      quantityinCORNELLHODGES,
      sizeChart,
      material,
      pattern,
      neckline,
      clothingLength,
      sleeveLength,
      season,
      occasion,
      style,
      feature,
      shape,
      scent,
      setting,
      use,
      installment,
      fit,
      stretch,
      careInstructions,
      waistHeight,
      volume,
      magnets,
      manufacturingTechnique,
      ageGroup,
      battery,
      bPAFree,
      otherDangerousGoodsorHazardousMaterials,
      cAProp65Carcinogens,
      carcinogen,
      cAProp65ReproChems,
      reprotoxicChemicals,
      containsBatteriesorCells,
      batteryType,
      howBatteriesArePacked,
      numberofBatteriesorcells,
      batteryorCellCapacityinWh,
      batteryorCellCapacityingrams,
      batteryorCellWeightingrams,
      flammableLiquid,
      flammableLiquidVolumeinml,
      aerosols,
      aerosolLiquidVolumeinml,
      safetyDataSheetforflammablematerials,
      safetyDataSheetforproductswithbatteries,
      safetyDataSheetforaerosolproducts,
      safetyDataSheetforotherdangerousgoodsorhazardousmaterials,
    } = req.body;

    if (!isValidFormat(colorTypeVariantimagePrice)) {
      return res.status(400).json({ msg: 'Bạn Đã Nhập Sai Định Dạng' });
    }

    const productTypeSetting = await ProductTypeSetting.findById(id);
    if (!productTypeSetting) {
      return res.status(404).json({ msg: 'Cài đặt không được tìm thấy' });
    }

    productTypeSetting.productType = productType || productTypeSetting.productType;
    productTypeSetting.category = category || productTypeSetting.category;
    productTypeSetting.brand = brand || productTypeSetting.brand;
    productTypeSetting.productDescription = productDescription || productTypeSetting.productDescription;
    productTypeSetting.identifierCodeType = identifierCodeType || productTypeSetting.identifierCodeType;
    productTypeSetting.identifierCode = identifierCode || productTypeSetting.identifierCode;
    productTypeSetting.colorTypeVariantimagePrice = colorTypeVariantimagePrice || productTypeSetting.colorTypeVariantimagePrice;
    productTypeSetting.packageWeight = packageWeight || productTypeSetting.packageWeight;
    productTypeSetting.packageLength = packageLength || productTypeSetting.packageLength;
    productTypeSetting.packageWidth = packageWidth || productTypeSetting.packageWidth;
    productTypeSetting.packageHeight = packageHeight || productTypeSetting.packageHeight;
    productTypeSetting.deliveryOptions = deliveryOptions || productTypeSetting.deliveryOptions;
    productTypeSetting.quantityinALEASEWILLIS = quantityinALEASEWILLIS || productTypeSetting.quantityinALEASEWILLIS;
    productTypeSetting.quantityinCORNELLHODGES = quantityinCORNELLHODGES || productTypeSetting.quantityinCORNELLHODGES;
    productTypeSetting.sizeChart = sizeChart || productTypeSetting.sizeChart;
    productTypeSetting.material = material || productTypeSetting.material;
    productTypeSetting.pattern = pattern || productTypeSetting.pattern;
    productTypeSetting.neckline = neckline || productTypeSetting.neckline;
    productTypeSetting.clothingLength = clothingLength || productTypeSetting.clothingLength;
    productTypeSetting.sleeveLength = sleeveLength || productTypeSetting.sleeveLength;
    productTypeSetting.season = season || productTypeSetting.season;
    productTypeSetting.occasion = occasion || productTypeSetting.occasion;
    productTypeSetting.style = style || productTypeSetting.style;
    productTypeSetting.feature = feature || productTypeSetting.feature;
    productTypeSetting.shape = shape || productTypeSetting.shape;
    productTypeSetting.scent = scent || productTypeSetting.scent;
    productTypeSetting.setting = setting || productTypeSetting.setting;
    productTypeSetting.use = use || productTypeSetting.use;
    productTypeSetting.installment = installment || productTypeSetting.installment;
    productTypeSetting.fit = fit || productTypeSetting.fit;
    productTypeSetting.stretch = stretch || productTypeSetting.stretch;
    productTypeSetting.careInstructions = careInstructions || productTypeSetting.careInstructions;
    productTypeSetting.waistHeight = waistHeight || productTypeSetting.waistHeight;
    productTypeSetting.volume = volume || productTypeSetting.volume;
    productTypeSetting.magnets = magnets || productTypeSetting.magnets;
    productTypeSetting.manufacturingTechnique = manufacturingTechnique || productTypeSetting.manufacturingTechnique;
    productTypeSetting.ageGroup = ageGroup || productTypeSetting.ageGroup;
    productTypeSetting.battery = battery || productTypeSetting.battery;
    productTypeSetting.bPAFree = bPAFree || productTypeSetting.bPAFree;
    productTypeSetting.otherDangerousGoodsorHazardousMaterials = otherDangerousGoodsorHazardousMaterials || productTypeSetting.otherDangerousGoodsorHazardousMaterials;
    productTypeSetting.cAProp65Carcinogens = cAProp65Carcinogens || productTypeSetting.cAProp65Carcinogens;
    productTypeSetting.carcinogen = carcinogen || productTypeSetting.carcinogen;
    productTypeSetting.cAProp65ReproChems = cAProp65ReproChems || productTypeSetting.cAProp65ReproChems;
    productTypeSetting.reprotoxicChemicals = reprotoxicChemicals || productTypeSetting.reprotoxicChemicals;
    productTypeSetting.containsBatteriesorCells = containsBatteriesorCells || productTypeSetting.containsBatteriesorCells;
    productTypeSetting.batteryType = batteryType || productTypeSetting.batteryType;
    productTypeSetting.howBatteriesArePacked = howBatteriesArePacked || productTypeSetting.howBatteriesArePacked;
    productTypeSetting.numberofBatteriesorcells = numberofBatteriesorcells || productTypeSetting.numberofBatteriesorcells;
    productTypeSetting.batteryorCellCapacityinWh = batteryorCellCapacityinWh || productTypeSetting.batteryorCellCapacityinWh;
    productTypeSetting.batteryorCellCapacityingrams = batteryorCellCapacityingrams || productTypeSetting.batteryorCellCapacityingrams;
    productTypeSetting.batteryorCellWeightingrams = batteryorCellWeightingrams || productTypeSetting.batteryorCellWeightingrams;
    productTypeSetting.flammableLiquid = flammableLiquid || productTypeSetting.flammableLiquid;
    productTypeSetting.flammableLiquidVolumeinml = flammableLiquidVolumeinml || productTypeSetting.flammableLiquidVolumeinml;
    productTypeSetting.aerosols = aerosols || productTypeSetting.aerosols;
    productTypeSetting.aerosolLiquidVolumeinml = aerosolLiquidVolumeinml || productTypeSetting.aerosolLiquidVolumeinml;
    productTypeSetting.safetyDataSheetforflammablematerials = safetyDataSheetforflammablematerials || productTypeSetting.safetyDataSheetforflammablematerials;
    productTypeSetting.safetyDataSheetforproductswithbatteries = safetyDataSheetforproductswithbatteries || productTypeSetting.safetyDataSheetforproductswithbatteries;
    productTypeSetting.safetyDataSheetforaerosolproducts = safetyDataSheetforaerosolproducts || productTypeSetting.safetyDataSheetforaerosolproducts;
    productTypeSetting.safetyDataSheetforotherdangerousgoodsorhazardousmaterials = safetyDataSheetforotherdangerousgoodsorhazardousmaterials || productTypeSetting.safetyDataSheetforotherdangerousgoodsorhazardousmaterials;

    const updatedSetting = await productTypeSetting.save();
    res.json(updatedSetting);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Lỗi máy chủ' });
  }
};

// Delete AI settings
exports.deleteSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const setting = await ProductTypeSetting.findById(id);
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }
    await setting.remove();
    res.json({ msg: 'Setting removed' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};
