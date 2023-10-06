import { CameraProjections, IfcViewerAPI } from 'web-ifc-viewer';
import { createSideMenuButton } from './utils/gui-creator';
import {
  IFCSPACE, IFCOPENINGELEMENT, IFCFURNISHINGELEMENT, IFCWALL, IFCWINDOW, IFCCURTAINWALL, IFCMEMBER, IFCPLATE, IFCWALLSTANDARDCASE, IFCROOF, IFCSLAB
} from 'web-ifc';
import {
  MeshBasicMaterial,
  LineBasicMaterial,
  Color,
  Vector2,
  DepthTexture,
  WebGLRenderTarget, Material, BufferGeometry, BufferAttribute, Mesh
} from 'three';
import { ClippingEdges } from 'web-ifc-viewer/dist/components/display/clipping-planes/clipping-edges';
import Stats from 'stats.js/src/Stats';
import { Earcut } from 'three/src/extras/Earcut';
// import { Math } ;
// import  mean  from 'mathjs';
// npm install mathjs

const container = document.getElementById('viewer-container');
const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(255, 255, 255) });
viewer.axes.setAxes();
viewer.grid.setGrid();
// viewer.shadowDropper.darkness = 1.5;

// Set up stats
const stats = new Stats();
stats.showPanel(2);
document.body.append(stats.dom);
stats.dom.style.right = '0px';
stats.dom.style.left = 'auto';
viewer.context.stats = stats;

viewer.context.ifcCamera.cameraControls

const manager = viewer.IFC.loader.ifcManager;

async function getAllWallMeshes() {
 const wallsIDs = manager.getAllItemsOfType(0, IFCWALL, false);
 const meshes = [];
  const customID = 'temp-gltf-subset';

  for(const wallID of wallsIDs) {
   const coordinates = [];
   const expressIDs = [];
   const newIndices = [];

   const alreadySaved = new Map();

   const subset = viewer.IFC.loader.ifcManager.createSubset({
     ids: [wallID],
     modelID,
     removePrevious: true,
     customID
   });

   const positionAttr = subset.geometry.attributes.position;
   const expressIDAttr = subset.geometry.attributes.expressID;

   const newGroups = subset.geometry.groups.filter((group) => group.count !== 0);
   const newMaterials = [];
   const prevMaterials = subset.material;
   let newMaterialIndex = 0;
   newGroups.forEach((group) => {
     newMaterials.push(prevMaterials[group.materialIndex]);
     group.materialIndex = newMaterialIndex++;
   });

   let newIndex = 0;
   for (let i = 0; i < subset.geometry.index.count; i++) {
     const index = subset.geometry.index.array[i];

     if (!alreadySaved.has(index)) {
       coordinates.push(positionAttr.array[3 * index]);
       coordinates.push(positionAttr.array[3 * index + 1]);
       coordinates.push(positionAttr.array[3 * index + 2]);

       expressIDs.push(expressIDAttr.getX(index));
       alreadySaved.set(index, newIndex++);
     }

     const saved = alreadySaved.get(index);
     newIndices.push(saved);
   }

   const geometryToExport = new BufferGeometry();
   const newVerticesAttr = new BufferAttribute(Float32Array.from(coordinates), 3);
   const newExpressIDAttr = new BufferAttribute(Uint32Array.from(expressIDs), 1);

   geometryToExport.setAttribute('position', newVerticesAttr);
   geometryToExport.setAttribute('expressID', newExpressIDAttr);
   geometryToExport.setIndex(newIndices);
   geometryToExport.groups = newGroups;
   geometryToExport.computeVertexNormals();

   const mesh = new Mesh(geometryToExport, newMaterials);
   meshes.push(mesh);
 }

  viewer.IFC.loader.ifcManager.removeSubset(modelID, undefined, customID);
  return meshes;
}


let gbxmlData;
let plantillaCerma;
let textoLider;
let plantillaHULC;

// viewer.IFC.loader.ifcManager.useWebWorkers(true, 'files/IFCWorker.js');
viewer.IFC.setWasmPath('files/');

viewer.IFC.loader.ifcManager.applyWebIfcConfig({
  USE_FAST_BOOLS: true,
  COORDINATE_TO_ORIGIN: false,	///*  lo comenté en primera versión, el original ponía firstModel
});

viewer.context.renderer.postProduction.active = true;

async function aHulc() {
  console.log ('estoy en aHulc');
  const surfaces = gbxmlData.Campus.Surface;
  console.log (surfaces);
  const mitabla = [];

  for (const surf in surfaces) {
    const puntos = [];
    for ( const pto in surfaces[surf].PlanarGeometry.PolyLoop.CartesianPoint ) {
      puntos.push (surfaces[surf].PlanarGeometry.PolyLoop.CartesianPoint[pto].Coordinate);
    }

    // console.log ("puntos",puntos);

    const lasX = [];
    const lasY = [];
    const lasZ = [];

    for ( const p in puntos ) {
      lasX.push(parseFloat(puntos[p][0]));
      lasY.push(parseFloat(puntos[p][1]));
      lasZ.push(parseFloat(puntos[p][2]));
    }
    const mediaX = lasX.reduce((total, el) => total + el, 0) / lasX.length;
    const mediaY = lasY.reduce((total, el) => total + el, 0) / lasY.length;
    const mediaZ = lasZ.reduce((total, el) => total + el, 0) / lasZ.length;
    // console.log ( 'mediaX', mediaX);
    const ptosModificados = [];
    for ( const p in puntos ) {
      ptosModificados.push([puntos[p][0]-mediaX, puntos[p][1]-mediaY, puntos[p][2]-mediaZ]);
    }
    // console.log ("ptosModificados",ptosModificados);
    
    // normal del plano, definida por dos vectores   // FER UNITARI PRIMER !!!
    const vector1 = [];
    vector1[0] = ptosModificados[0][0]-ptosModificados[1][0]
    vector1[1] = ptosModificados[0][1]-ptosModificados[1][1]
    vector1[2] = ptosModificados[0][2]-ptosModificados[1][2]
    const vector2 = [];
    vector2[0] = ptosModificados[0][0]-ptosModificados[2][0];
    vector2[1] = ptosModificados[0][1]-ptosModificados[2][1];
    vector2[2] = ptosModificados[0][2]-ptosModificados[2][2];
    // console.log(Math.cross(vector1,vector2));
    const normal = CrossVectors( vector1,vector2 );

    // calcular tilt
    const normalUnitaria = convertirAVectorUnitario(normal);
    // console.log(normalUnitaria);
    const prod = calcularProductoEscalar(normalUnitaria, [0,0,1]) ;
    const tiltPi = Math.acos(prod);
    const tilt = tiltPi * (180 / Math.PI);
    var azimutPi;
    if (tilt == 180 || tilt == -180 || tilt == 0 )  azimutPi = 0;
    else                                            azimutPi = calcularAzimutPi(normal);

    // console.log('tilt', tilt,'azimutPi', azimutPi);

    // console.log('1,1,1', calcularAzimutPi([1,1,1]));
    // console.log('-1,1,1', calcularAzimutPi([-1,1,1]));
    // console.log('1,-1,1', calcularAzimutPi([1,-1,1]));
    // console.log('-1,-1,1', calcularAzimutPi([-1,-1,1]));
    // console.log('0,0,1', calcularAzimutPi([0,0,1]));

    // girar ptosModificados con el azimut y luego con tilt
    // const ptosConGiroAzimut = [];
    const ptosModificados2D = [];
    for ( const p in ptosModificados ) {
      const punto = ptosModificados[p];
      // const ptosConGiroAzimut = [];
      const ptoGirado = girarEjeZPtoPI( punto, Math.PI/2 - azimutPi );
      const ptoGirado2 = girarEjeYPtoPI( ptoGirado, tiltPi );
      ptosModificados2D.push(ptoGirado2);
      mitabla.push([punto[0],punto[1],punto[2], ptoGirado[0], ptoGirado[1], ptoGirado[2],ptoGirado2[0], ptoGirado2[1], ptoGirado2[2],azimutPi* (180 / Math.PI), tiltPi* (180 / Math.PI)]);
    }
  }
  console.log( "mitabla" );
  console.table( mitabla );

  // adquisición de plantilla HULC
  var url = "visorctehexml/archivos/pilotvalencia5.ctehexml";

  let response = await fetch(url);    // este es el método mas moderno de adquisicion de fichero de servidor
  let text = await response.text();
  // let text = await response.json();
  // let text = await response.xml();
  // console.log( text);
  // console.log( XML2jsobj(text));

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, "text/xml");
  console.log( "plantillaHULCenXml");
  console.log( xmlDoc.documentElement);
  // console.log( xmlDoc.documentElement.EntradaGraficaLIDER);       //NO VA
  // console.log( xmlDoc.documentElement['EntradaGraficaLIDER']);    //NO VA
  // console.log( xmlDoc.documentElement[EntradaGraficaLIDER]);      //NO VA
  const childNodes = xmlDoc.documentElement.children;

  console.log(childNodes.length); ///

  plantillaHULC = '<?xml version="1.0" encoding="UTF-8"?>\n<CTE-HE-XML>\n\t';
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];
    // obj[node.nodeName] = node.textContent;
    // console.log( childNodes[i]);
    // console.log( childNodes[i].nodeName);
    // console.log( childNodes[i].textContent);
    // plantillaHULC += childNodes[i].textContent;
    if (childNodes[i].nodeName == 'EntradaGraficaLIDER') 
      plantillaHULC += "\n\t<EntradaGraficaLIDER>\n\t\t<![CDATA["+childNodes[i].textContent+"]]>\n\t</EntradaGraficaLIDER>\n\t";
    else {
      const xmlSerializer = new XMLSerializer();
      const xmlString = xmlSerializer.serializeToString(childNodes[i]);
      // plantillaHULC += xmlString +"\n";
      plantillaHULC += xmlString ;
    }
  }
  plantillaHULC += "\n</CTE-HE-XML>";

  console.log( "plantillaHULC");
  console.log( plantillaHULC);

  const nuevoContenido = "NUEVO CONTENIDO";

  // const regex = /\$ POLIGONOS(.*?)\$/g;
  const regex = /\$ POLIGONOS([\s\S]*?)\.\.\r\n\$/g;
  // console.log( textoLiplantillaHULCder.replace(regex, `$ POLIGONOS${nuevoContenido}$`));

/*
  const obj = {};

  const rootElement = xmlDoc.documentElement;
  if (rootElement.nodeName === '#document') {
    const childNodes = rootElement.children;
    for (let i = 0; i < childNodes.length; i++) {
      const node = childNodes[i];
      obj[node.nodeName] = node.textContent;
    }
  }
*/
/*
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      // console.log ('xhr.responseXML: ', xhr.responseXML);
      // plantillaHULC = XML2jsobj(xhr.responseXML.documentElement);
      plantillaHULC = xhr.responseXML.documentElement;
      xhr = null;
      console.log ('plantillaHULC: ',plantillaHULC);
      // console.log ('plantillaHULCint: ',plantillaHULC.DatosGenerales);
      // console.log ('plantillaHULCint: ',plantillaHULC['DatosGenerales']);
      console.log ('tipeof: ',typeof(plantillaHULC));
    }
  }
  */
  downloadXML(plantillaHULC, query +'.ctehexml');
} // aHulc
/*
function modificarContenidoEntreMarcadores(texto, nuevoContenido) {
  const regex = /\$POLIGONOS(.*?)\$/g;
  return texto.replace(regex, `$POLIGONOS${nuevoContenido}$`);
}

const textoOriginal = "Este es un texto con $POLIGONOScontenido antiguo$ que quiero cambiar. $OTRO_CONTENIDO$ Aquí hay más texto $POLIGONOSotro contenido$.";
const nuevoContenido = "nuevo contenido";

const textoModificado = modificarContenidoEntreMarcadores(textoOriginal, nuevoContenido);
console.log(textoModificado);
*/
function girarEjeZPtoPI( punto, aziPI ) {
  // var x = punto[0];
  // var y = punto[1];
  // var z = punto[2];
  const ptoGirado = [];
  ptoGirado[0] = parseFloat((punto[0] * Math.cos(aziPI) - punto[1] * Math.sin(aziPI)).toFixed(4));
  ptoGirado[1] = parseFloat((punto[0] * Math.sin(aziPI) + punto[1]* Math.cos(aziPI)).toFixed(4));
  ptoGirado[2] = punto[2];

  return ptoGirado ;
}

function girarEjeYPtoPI( punto, tiltPI ) {
  // var x = punto[0];
  // var y = punto[1];
  // var z = punto[2];
  const ptoGirado = [];
  ptoGirado[0] = punto[0] ;
  ptoGirado[1] = parseFloat((punto[1] * Math.cos(tiltPI) - punto[2] * Math.sin(tiltPI)).toFixed(4));

  if (punto[2] == 0) ptoGirado[2] =0;
  else        ptoGirado[2] = parseFloat((punto[1] * Math.sin(tiltPI) + punto[2] * Math.cos(tiltPI)).toFixed(4));

  return ptoGirado ;
}

function girarEjeXPtoPI( punto, tiltPI ) {
  // var x = punto[0];
  // var y = punto[1];
  // var z = punto[2];
  const ptoGirado = [];
  ptoGirado[0] = punto[0] * Math.cos(tiltPI) - punto[2] * Math.sin(tiltPI);
  ptoGirado[1] = punto[1] ;
  ptoGirado[2] = punto[0] * Math.sin(tiltPI) + punto[2] * Math.cos(tiltPI);

  return ptoGirado ;
}

function CrossVectors( a, b ) {
  const ax = a[0], ay = a[1], az = a[2];
  const bx = b[0], by = b[1], bz = b[2];
  const normal = [];
  normal[0] = ay * bz - az * by;
  normal[1] = az * bx - ax * bz;
  normal[2] = ax * by - ay * bx;
  return normal;
}

function convertirAVectorUnitario(vector) {
  var sumaCuadrados = 0;
  for (var i = 0; i < vector.length; i++) {
    sumaCuadrados += Math.pow(vector[i], 2);
  }
  var magnitud = Math.sqrt(sumaCuadrados);
  var vectorUnitario = [];
  for (var i = 0; i < vector.length; i++) {
    vectorUnitario.push(vector[i] / magnitud);
  }
  return vectorUnitario;
}

function calcularProductoEscalar(vector1, vector2) {
  // console.log('long1',vector1.length, vector2.length);

  if (vector1.length !== vector2.length) {
    throw new Error("Los vectores deben tener la misma longitud.");
  }
  let productoEscalar = 0;
  for (let i = 0; i < vector1.length; i++) {
    productoEscalar += vector1[i] * vector2[i];
  }
  return productoEscalar;
}

function calcularAzimutPi(vector) {
  var azimutPi = Math.atan2(vector[1], vector[0]);
  // const azimutPi = azimutPi * (180 / Math.PI);    // NO LO USAMOS DE MOMENTO
  return azimutPi;
}

async function aCerma() {
  console.log("ESTOY EN aCerma")
  const surfaces = gbxmlData.Campus.Surface;
  // console.log(surfaces);
  const matchingSurfaces = {};

  // Iterate over surfaces and accumulate areas and other properties for each id, azimuth, and tilt
  for (const surf in surfaces) {
    const surface = surfaces[surf];
    const id = surface.constructionIdRef;

    // Calculate the area of the surface from its polygon vertices
    const area = parseFloat(surface.RectangularGeometry.Height) * parseFloat(surface.RectangularGeometry.Width);

    // Extract other properties of interest
    const azimuth = parseFloat(surface.RectangularGeometry.Azimuth);
    const tilt = parseFloat(surface.RectangularGeometry.Tilt);

    if (!(id in matchingSurfaces)) {
      matchingSurfaces[id] = {};
    }
    if (!(azimuth in matchingSurfaces[id])) {
      matchingSurfaces[id][azimuth] = {};
    }
    if (!(tilt in matchingSurfaces[id][azimuth])) {
      matchingSurfaces[id][azimuth][tilt] = {
        'area': 0,
      };
    }

    matchingSurfaces[id][azimuth][tilt].area += area;
   
  }
  // console.log ('PRU',matchingSurfaces);
  // Iterate over accumulated areas and create objects with U-value, accumulated area, azimuth, and tilt
  const result = [];
  for (const id in matchingSurfaces) {
    for (const azimuth in matchingSurfaces[id]) {
      for (const tilt in matchingSurfaces[id][azimuth]) {
        const area = matchingSurfaces[id][azimuth][tilt].area;
        const uValue = gbxmlData.Construction.find(construction => construction.id === id)['U-value'];
        result.push({
          'id': id,
          'U-value': uValue,
          'area': area,
          'azimuth': parseFloat(azimuth),
          'tilt': parseFloat(tilt),
        });
      }
    }
  }
  // console.log ('PRU2',result);


  // adquisición de plantilla CERMA
  var url = "models/VAlencia_V1.xml";
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      plantillaCerma = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      // console.log('datos plantilla CERMA');
      console.log(plantillaCerma);
      // console.log(result);
      // console.log(plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt);
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.U_Muro_ext_W_m2K.name = result[1]['U-value'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_norte_m2.name = result[0]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_oeste_m2.name = result[1]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_sur_m2.name = result[2]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Muros.MurosExt.MuroExt.Muro_ext_este_m2.name = result[3]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.U_Cubierta_incl_W_m2K.name = result[4]['U-value'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.Cubierta_incl_sur_m2.name = result[4]['area'];
      plantillaCerma.DatosPersonalizados.Cerma.Cubiertas.CubiertasIncl.CubiertaIncl.Cubierta_incl_norte_m2.name = result[5]['area'];
      textoaCerma = jsobj2XML(plantillaCerma, 'DatosEnergeticosDelEdificio');
      downloadXML(textoaCerma, query +'.xml');
      // console.log ('367:',textoaCerma);
    }
  }
  // console.log ('369:',textoaCerma);
  const propiedades = [];
  const propiedadesLimpio = [];
  const wallsIDs = await manager.getAllItemsOfType(0, IFCWALL, false);

  for (const wallID of wallsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, wallID);
    let wallData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "PSET Wall Material Takeoff")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "Heat Transfer Coefficient (U)")
            {
              // wallData.push({nombre: "U", tag: data.NominalValue.value}
              wallData.push({'U': data.NominalValue.value});
            }
            if(data.Name.value == "Area")
            {
              // wallData.push({nombre: "Area", tag: data.NominalValue.value})
              wallData.push({'Area': data.NominalValue.value});
            }
          }
        }
      }
    }
    propiedades[wallID] = wallData;
    propiedadesLimpio[wallID] = wallData;
  }
  // console.log(propiedades);
  // console.log(propiedadesLimpio);

  const windowsIDs = await manager.getAllItemsOfType(0, IFCWINDOW, false);
  for (const windowID of windowsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, windowID);
    let windowData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);         
      if(pset.Name.value == "Pset_WindowCommon" || pset.Name.value == "Cotas")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "ThermalTransmittance")
            {
              windowData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == "\\X\\C1rea")
            {
              windowData.push({nombre: "Area", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Altura")
            {
              windowData.push({nombre: "Altura", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Anchura")
            {
              windowData.push({nombre: "Anchura", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[windowID] = windowData;
    propiedadesLimpio[windowID] = windowData;
    //console.log(windowData);
  }

  const roofsIDs = await manager.getAllItemsOfType(0, IFCROOF, false);

  for (const roofID of roofsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, roofID);
    let roofData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "PSET Roof Material Takeoff")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "Heat Transfer Coefficient (U)")
            {
              roofData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == "Area")
            {
              roofData.push({nombre: "Area", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[roofID] = roofData;
    propiedadesLimpio[roofID] = roofData;
    //console.log(roofData);
  }

  const slabsIDs = await manager.getAllItemsOfType(0, IFCSLAB, false);

  for (const slabsID of slabsIDs) {
    const psetsIDs = await viewer.IFC.loader.ifcManager.properties.getPropertySets(0, slabsID);
    let slabData = [];
    for (const psetsID of psetsIDs) {
      const pset = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, psetsID.expressID);

      if(pset.Name.value == "Pset_SlabCommon" || pset.Name.value == "Cotas")
      {
        if(pset.HasProperties)
        {
          for (const propID of pset.HasProperties) {
            const data = await viewer.IFC.loader.ifcManager.properties.getItemProperties(0, propID.value);
            if(data.Name.value == "ThermalTransmittance")
            {
              slabData.push({nombre: "U", tag: data.NominalValue.value})
            }
            if(data.Name.value == '\\X\\C1rea')
            {
              slabData.push({nombre: "Area", tag: data.NominalValue.value})
            }
          }
        }
      }
    }
    propiedades[slabsID] = slabData;
    propiedadesLimpio[slabsID] = slabData;
    //console.log(slabData);
  }

  //** */     dibuja los elementos gbxml     atencion a los giros linea //**
  // /*
  const surface = gbxmlData.Campus.Surface;
  for(const surf in surface)
  {
    // if (gbxmlData.Campus.Surface[surf].RectangularGeometry.surfaceType == "Shade") {
      // const orient = gbxmlData.Campus.Surface[surf].RectangularGeometry;
      // const orient = surface[surf].RectangularGeometry;
      const Wallid = surface[surf].RectangularGeometry.id;
      const az =  surface[surf].RectangularGeometry.Azimuth;
      const tl = surface[surf].RectangularGeometry.Tilt;
      // const data = surface[surf].PlanarGeometry;
      const coordsList = [];
      for(const pt in surface[surf].PlanarGeometry.PolyLoop.CartesianPoint)
      {
        const point = surface[surf].PlanarGeometry.PolyLoop.CartesianPoint[pt];
        coordsList.push(point.Coordinate[0]);
        coordsList.push(point.Coordinate[2]);
        coordsList.push(point.Coordinate[1]);
      }
      // console.log(coordsList);

      const triangles = Earcut.triangulate(coordsList, null, 3);
      const scene = viewer.IFC.context.getScene();
      const geometry = new BufferGeometry();
      const vertices = new Float32Array(triangles.length * 3);

      // console.log(triangles);

      let id = 0;
      for(const idx in triangles)
      {
        let pt = triangles[idx];
        const point = surface[surf].PlanarGeometry.PolyLoop.CartesianPoint[pt];
        vertices[id] = point.Coordinate[0];
        id++;
        vertices[id] = point.Coordinate[2];
        id++;
        vertices[id] = point.Coordinate[1];   //** Poniendo esta en negativo. Va al sitio
        id++;
      }
      geometry.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
      const material = new MeshBasicMaterial( { color: 0xff0000 } );
      const mesh = new Mesh( geometry, material );
      // console.log (surface[surf].surfaceType);
      // console.log (vertices);
      scene.add(mesh);
    // } //if
  }
// ** */
} // acerma


// Setup loader

// const lineMaterial = new LineBasicMaterial({ color: 0x555555 });
// const baseMaterial = new MeshBasicMaterial({ color: 0xffffff, side: 2 });

let first = true;
let model;

const loadIfc = async (event) => {
  console.log ("Estoy en loadIFC");

  // tests with glTF
  // const file = event.target.files[0];
  // const url = URL.createObjectURL(file);
  // const result = await viewer.GLTF.exportIfcFileAsGltf({ ifcFileUrl: url });
  //
  // const link = document.createElement('a');
  // link.download = `${file.name}.gltf`;
  // document.body.appendChild(link);
  //
  // for(const levelName in result.gltf) {
  //   const level = result.gltf[levelName];
  //   for(const categoryName in level) {
  //     const category = level[categoryName];
  //     link.href = URL.createObjectURL(category.file);
  //     link.click();
  //   }
  // }
  //
  // link.remove();

  const overlay = document.getElementById('loading-overlay');
  const progressText = document.getElementById('loading-progress');

  overlay.classList.remove('hidden');
  progressText.innerText = `Loading`;

  viewer.IFC.loader.ifcManager.setOnProgress((event) => {
    const percentage = Math.floor((event.loaded * 100) / event.total);
    progressText.innerText = `Loaded ${percentage}%`;
  });

  viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });

  // aqui esta el error llama a ..gb.xml desde el servidor en lugar de desde el cliente
  /*
  let url = event.target.files[0].name;
  url = "models/" + url.replace(".ifc", ".xml");
  console.log(url);
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      gbxmlData = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      console.log('datos gbXml');
      console.log(gbxmlData);
    }
  }
  */


  // const divAbreXml = document.createElement('div');   document.getElementsByTagName('body')[0].appendChild(divAbreXml);
  const divAbreXml = document.createElement('div');   document.body.appendChild(divAbreXml);

  divAbreXml.style.top="5%";		
  divAbreXml.style.left="5%";		
  // divAbreXml.style.position="absolute";		
  divAbreXml.style.width = '90%';
  divAbreXml.style.height = '90%';
  divAbreXml.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'; // Fondo semitransparente
  
  divAbreXml.style.display = 'flex';
  divAbreXml.style.flexDirection = 'row';
  divAbreXml.style.alignItems = 'center';
  divAbreXml.style.justifyContent = 'center';
  divAbreXml.style.position = 'absolute';
  // divAbreXml.style.top = '50%';
  // divAbreXml.style.left = '50%';
  // divAbreXml.style.transform = 'translate(-50%, -50%)';


  divAbreXml.id="divAbreXml";						

  var textElement = document.createElement('p');    divAbreXml.appendChild(textElement);
  textElement.textContent = 'Abre el archivo XML correspondiente:';
  // textElement.style.textAlign = 'center';
  textElement.style.color = 'white';

  // textElement.style.position = 'absolute';
  // textElement.style.top = '40%';
  // textElement.style.left = '50%';
  textElement.style.marginRight = '10px'; // Espacio entre textElement e input
  
  var cancelButton = document.createElement('button');
  divAbreXml.appendChild(cancelButton);
  cancelButton.textContent = 'Cancelar';
  // cancelButton.style.position = 'absolute';
  // cancelButton.style.top = '60%';
  // cancelButton.style.left = '50%';
  // cancelButton.style.transform = 'translate(-50%, -50%)';
  cancelButton.addEventListener('click', function() {
    divAbreXml.style.display = 'none';
  });

  var input = document.createElement('input');    divAbreXml.appendChild(input);
      input.type = 'file';
      input.accept = '.xml';
      // input.style.display = 'none';

      // input.style.position = 'absolute';
      // input.style.top = '50%';
      // input.style.left = '50%';
      // input.style.transform = 'translate(-50%, -50%)'; // Centra el input en el medio
      
      input.style.marginRight = '10px'; // Espacio entre input y cancelButton



      input.addEventListener('change', function(event) {
        // console.log("ESTOY EN CHANGUE");
        var selectedFile = event.target.files[0];
        // console.log(selectedFile);

        if (selectedFile) {

          var reader = new FileReader();
          reader.onload = function(event) {
            // console.log("ESTOY EN ONLOAD");

            // El contenido del archivo estará en event.target.result
            var XmlContents = event.target.result;

            // Haz lo que necesites con la variable de contenido
            // console.log('Contenido del archivo asignado a una variable:');
            // console.log(XmlContents);

            // Utiliza DOMParser para analizar el contenido XML y convertirlo en un objeto XML
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(XmlContents, "text/xml");
            var xmlDocEl = xmlDoc.documentElement;

            // Haz lo que necesites con el objeto XML
            // console.log('Contenido del archivo convertido en objeto XML:');
            // console.log(xmlDocEl);

            gbxmlData = XML2jsobj(xmlDocEl);
            console.log('datos gbXml');
            console.log(gbxmlData);
            divAbreXml.style.display="none";
        
          };
          // Lee el contenido del archivo como texto
          reader.readAsText(selectedFile);
        } else {
            console.log('Ningún archivo seleccionado');
        }
      });

  //-----------------------------------------------------------------------
  model = await viewer.IFC.loadIfc(event.target.files[0], false);

  // aCerma();

  model.material.forEach(mat => mat.side = 2);
  if (first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');

};
 
function XML2jsobj(node) {
  /**
   * XML2jsobj v1.0
   * Converts XML to a JavaScript object
   * so it can be handled like a JSON message
   *
   * By Craig Buckler, @craigbuckler, http://optimalworks.net
   *
   * As featured on SitePoint.com:
   * http://www.sitepoint.com/xml-to-javascript-object/
   *
   * Please use as you wish at your own risk.
   */
	var	data = {};
	// append a value
	function Add(name, value) {
		if (data[name]) {
			if (data[name].constructor != Array) {
				data[name] = [data[name]];
			}
			data[name][data[name].length] = value;
		}
		else {
			data[name] = value;
		}
	};
	// element attributes
	var c, cn;
	for (c = 0; cn = node.attributes[c]; c++) {
		Add(cn.name, cn.value);
	}
	// child elements
	for (c = 0; cn = node.childNodes[c]; c++) {
		if (cn.nodeType == 1) {
			if (cn.childNodes.length == 1 && cn.firstChild.nodeType == 3) {
				// text value
				Add(cn.nodeName, cn.firstChild.nodeValue);
			}
			else {
				// sub-object
				Add(cn.nodeName, XML2jsobj(cn));
			}
		}
	}
	return data;
}

function jsobj2XML(obj, rootElementName, tabs = 0, includeDeclaration = true) {
  var xml = '';

  // Add the root element
  if (includeDeclaration) {
    xml += '<?xml version="1.0" encoding="UTF-8"?>\n';
  }

  var addTabs = '';
  for (var t = 0; t < tabs; t++) {
    addTabs += '\t'
  }

  var isArray = true;
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      // Check if prop2 is a number or a string describing a number
      var isNumber = !isNaN(parseFloat(prop)) && isFinite(prop);
      if (!isNumber) {
          isArray = false;
      }
    }
  }

  if(isArray) {

    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
          var val = obj[prop];
          var hasObjects = false;
          for (var prop2 in val) {
            if (val.hasOwnProperty(prop2)) {
              var nval = val[prop2];
              // If the value is an object, recurse
              if (typeof nval === 'object') {
                hasObjects = true;
              }
            }
          }
          if(hasObjects){
            xml += jsobj2XML(val, rootElementName, tabs, false);
          }
          else
          {
            xml += jsobj2XML_element(val, rootElementName, tabs);
          }
      }
    }
    
  }
  else {

    xml += addTabs + '<' + rootElementName + '>\n';

    // Convert each property to an XML element
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        var val = obj[prop];

        // If the value is an object, recurse
        if (typeof val === 'object') {
          var hasObjects = false;
          for (var prop2 in val) {
            if (val.hasOwnProperty(prop2)) {
              var nval = val[prop2];
              // If the value is an object, recurse
              if (typeof nval === 'object') {
                hasObjects = true;
              }
            }
          }
          if(hasObjects){
            xml += jsobj2XML(val, prop, tabs + 1, false);
          }
          else
          {
            xml += jsobj2XML_element(val, prop, tabs + 1);
          }
        } else {
          xml += prop + '=\"' + val + '\"';
        }
      }
    }

    // Close the root element
    xml += addTabs + '</' + rootElementName + '>\n';
  }

  return xml;
}

function jsobj2XML_element(obj, rootElementName, tabs = 0) {
  var xml = '';

  var addTabs = '';
  for (var t = 0; t < tabs; t++) {
    addTabs += '\t'
  }
  xml += addTabs + '<' + rootElementName + ' ';

  // Convert each property to an XML element
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      var val = obj[prop];

      // If the value is an object, recurse
      if (typeof val === 'object') {

        var hasObjects = false;
        for (var prop2 in val) {
          if (val.hasOwnProperty(prop2)) {
            var nval = val[prop2];
            // If the value is an object, recurse
            if (typeof nval === 'object') {
              hasObjects = true;
            }
          }
        }
        if(hasObjects){
          xml += jsobj2XML(val, prop, tabs + 1, false);
        }
        else
        {
          xml += jsobj2XML_element(val, prop, tabs + 1);
        }
      } else {
        xml += prop + '=\"' + val + '\"';
      }
    }
  }

  // Close the root element
  xml += '/>\n';

  return xml;
}

let textoaCerma ='';
async function miload() {
  console.log("Estoy en miload");
  // tests with glTF
  // const file = event.target.files[0];
  // const url = URL.createObjectURL(file);
  // const result = await viewer.GLTF.exportIfcFileAsGltf({ ifcFileUrl: url });
  //
  // const link = document.createElement('a');
  // link.download = `${file.name}.gltf`;
  // document.body.appendChild(link);
  //
  // for(const levelName in result.gltf) {
  //   const level = result.gltf[levelName];
  //   for(const categoryName in level) {
  //     const category = level[categoryName];
  //     link.href = URL.createObjectURL(category.file);
  //     link.click();
  //   }
  // }
  //
  // link.remove();

  const overlay = document.getElementById('loading-overlay');
  const progressText = document.getElementById('loading-progress');

  overlay.classList.remove('hidden');
  progressText.innerText = `Loading`;

  viewer.IFC.loader.ifcManager.setOnProgress((event) => {
    const percentage = Math.floor((event.loaded * 100) / event.total);
    progressText.innerText = `Loaded ${percentage}%`;
  });

  viewer.IFC.loader.ifcManager.parser.setupOptionalCategories({
    [IFCSPACE]: false,
    [IFCOPENINGELEMENT]: false
  });


  // adquisición de datos desde el fichero ...gb.xml
  var url = "models/" + query + ".xml";
  // AJAX request
  var xhr = (window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP"));
  xhr.onreadystatechange = XHRhandler;
  xhr.open("GET", url, true);
  xhr.send(null);
  // handle response
  function XHRhandler() {
    if (xhr.readyState == 4) {
      // console.log('datos gbXml como xml');
      // console.log(xhr.responseXML.documentElement);


      gbxmlData = XML2jsobj(xhr.responseXML.documentElement);
      xhr = null;
      console.log('datos gbXml como obj');
      console.log(gbxmlData);
    }
  }
  model = await viewer.IFC.loadIfcUrl("models/"+query+".ifc", false);

  model.material.forEach(mat => mat.side = 2);

 
  // aHulc();
  // aCerma();

  if (first) first = false
  else {
    ClippingEdges.forceStyleUpdate = true;
  }

  // await createFill(model.modelID);
  // viewer.edges.create(`${model.modelID}`, model.modelID, lineMaterial, baseMaterial);

  await viewer.shadowDropper.renderShadow(model.modelID);

  overlay.classList.add('hidden');

};

//este es el input llamado por el botón abrir archivo
const inputElement = document.createElement('input');
inputElement.setAttribute('type', 'file');
inputElement.classList.add('hidden');
inputElement.addEventListener('change', loadIfc, false);

const handleKeyDown = async (event) => {
  if (event.code === 'Delete') {
    viewer.clipper.deletePlane();
    viewer.dimensions.delete();
  }
  if (event.code === 'Escape') {
    viewer.IFC.selector.unHighlightIfcItems();
  }
  if (event.code === 'KeyC') {
    viewer.context.ifcCamera.toggleProjection();
  }
};

// window.onmousemove = () => viewer.IFC.selector.prePickIfcItem();    ///*
window.onkeydown = handleKeyDown;
window.ondblclick = async () => {

  if (viewer.clipper.active) {
    viewer.clipper.createPlane();
  } else {
    const result = await viewer.IFC.selector.highlightIfcItem(true);
    if (!result) return;
    const { modelID, id } = result;
    const props = await viewer.IFC.getProperties(modelID, id, true, false);
    // console.log(props);
  }
};
async function opendir() {
  // console.log ("Estoy en opendir");
  var hr = new XMLHttpRequest();
  hr.open("POST", "leedir.php", true);			////MIRAR BIEN LO DE TRUE AL FINAL
  hr.setRequestHeader("Content-type","application/json; charset=utf-8");
  hr.addEventListener('load', function(e) {
      if (hr.response.lastIndexOf('ERROR', 0) === 0) {
      console.log (hr.response+".");
    } else {
      // console.log (hr.response+".");

      const listaArchivos = JSON.parse(hr.response);
      // console.log (listaArchivos);
      // const dialogo = document.createElement('dialog');   
      const divListaarchivos = document.createElement('div');   
      // divListaarchivos.style.display="none";		
      divListaarchivos.style.top="5%";		
      divListaarchivos.style.left="5%";		
      divListaarchivos.style.position="absolute";		
      divListaarchivos.id="divColores";						document.getElementsByTagName('body')[0].appendChild(divListaarchivos);
      
      //cabecera de tabla
      const row = document.createElement('div');         divListaarchivos.appendChild(row);
      row.className = 'row';

      const createCell = (className, innerHTML) => {
        const cell = document.createElement('div');
        cell.className = `cell ${className}`;
        cell.innerHTML = innerHTML;
        return cell;
      };
      
      row.appendChild(createCell('colIni', 'IFC'));
      row.appendChild(createCell('textPeque', ''));
      row.appendChild(createCell('textPeque', ''));
      row.appendChild(createCell('textPeque', '(gb)XML'));
      row.appendChild(createCell('textPeque', ''));




      listaArchivos.forEach((archivo) => {
        const row = document.createElement('div');         divListaarchivos.appendChild(row);
        row.className = 'row';
        row.setAttribute('onclick', 'parent.open(`index.html?'+archivo[0]+'`)');
        row.setAttribute('title', 'click to open model');
          const cell = document.createElement('div');         row.appendChild(cell);
          cell.className = 'cell colIni';
          cell.innerHTML = archivo[0];

          const cell2 = document.createElement('div');         row.appendChild(cell2);
          cell2.className = 'cell textPeque';
          cell2.innerHTML = archivo[1];

          const cell3 = document.createElement('div');         row.appendChild(cell3);
          cell3.className = 'cell textPeque';
          cell3.innerHTML = archivo[2];

          const cell4 = document.createElement('div');         row.appendChild(cell4);
          cell4.className = 'cell textPeque';
           if (typeof archivo[3] !== 'undefined') {
            cell4.innerHTML = archivo[3];
          } else {
            cell4.innerHTML = "";
          }
  
          const cell5 = document.createElement('div');         row.appendChild(cell5);
          cell5.className = 'cell textPeque';
           if (typeof archivo[4] !== 'undefined') {
            cell5.innerHTML = archivo[4];
          } else {
            cell5.innerHTML = "";
          }

      });
      // divListaarchivos.style.visibility = "visible";
      // divListaarchivos.style.display = "block";
    }
  });
  var enviaArray={};
  let pru = "PRU";
  // console.log ( 'tablaActual:',tablaActual,'variable:',variableCompleta, 'onoff:','off', 'servSQL:',servSQL);
  enviaArray["datos"]= {pru:pru};
  hr.send(JSON.stringify(enviaArray));	
}

function downloadXML(xmlString, filename) {
  // create a blob object
  const blob = new Blob([xmlString], {type: 'text/xml'});

  // create a download link
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;

  // simulate a click on the download link
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

//Setup UI
const loadButton = createSideMenuButton('./resources/folder-icon.svg');
loadButton.addEventListener('click', () => {
  loadButton.blur();
  inputElement.click();
});

const getFileButton = createSideMenuButton('./resources/folder-icon.svg');
getFileButton.addEventListener('click', () => {
  getFileButton.blur();
  opendir();
});

const sectionButton = createSideMenuButton('./resources/section-plane-down.svg');
sectionButton.addEventListener('click', () => {
  sectionButton.blur();
  viewer.clipper.toggle();
});

// const dropBoxButton = createSideMenuButton('./resources/dropbox-icon.svg');
// dropBoxButton.addEventListener('click', () => {
//   dropBoxButton.blur();
//   viewer.dropbox.loadDropboxIfc();
// });

let textFileUrl = null;
function generateTextFileUrl(txt) {
  let fileData = new Blob([txt], {type: 'text/plain'});

  // If a file has been previously generated, revoke the existing URL
  if (textFileUrl !== null) {
      window.URL.revokeObjectURL(textFile);
  }

  textFileUrl = window.URL.createObjectURL(fileData);

  // Returns a reference to the global variable holding the URL
  // Again, this is better than generating and returning the URL itself from the function as it will eat memory if the file contents are large or regularly changing
  return textFileUrl;
};

const sideMenu = document.getElementById('side-menu-left');

const but = document.createElement('button');                 sideMenu.appendChild(but);
      but.classList.add('basic-button');
      but.setAttribute('id', 'cerma');
      but.addEventListener("click", aCerma);
const image = document.createElement("img");                  but.appendChild(image);
      image.setAttribute("src", './resources/cerma3.svg');
      image.classList.add('icon');
      image.style.maxWidth = "90px";

const aElement2 = document.createElement('a');                 sideMenu.appendChild(aElement2);
      aElement2.classList.add('basic-button');
      aElement2.setAttribute('id', 'hulc');
      // aElement2.setAttribute('download', 'hulc.xml');
      // aElement2.setAttribute('href', '#');
      aElement2.addEventListener("click", aHulc);
const image2 = document.createElement("img");                   aElement2.appendChild(image2);
      image2.setAttribute("src", './resources/hulc.png');
      image2.classList.add('icon');
      image2.style.maxWidth = "90px";


if (typeof query !== 'undefined') 
miload();
