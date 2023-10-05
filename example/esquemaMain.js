

39	async function getAllWallMeshes()

121	async function aHulc()

287	function girarEjeZPtoPI( punto, aziPI ) 
299	function girarEjeYPtoPI( punto, tiltPI )
313	function girarEjeXPtoPI( punto, tiltPI )
325	function CrossVectors( a, b )
335	function convertirAVectorUnitario(vector)
348	function calcularProductoEscalar(vector1, vector2)
361	function calcularAzimutPi(vector) 

367	async function aCerma() 

647 const loadIfc = async (event)     ESTE ES EL PRINCIPAL ORIGINAL

724	function XML2jsobj(node) 
771	function jsobj2XML

862	function jsobj2XML_element

909 async function miload() 


1007	window.ondblclick = async ()

1019	async function opendir() 		llama a leedir.php    define un onclick que abre nueva ventana con el archivo seleccionado en GET 

1105 function downloadXML(xmlString, filename) 


1121 BUTTONS:

// abrir cliente_________________________________
*  loadButton.blur();
  inputElement.click();    >> inputElement.addEventListener('change', loadIfc, false);
  
*  getFileButton.blur();
  opendir();
  
*  section
 
1147 function generateTextFileUrl(txt)

*	aCerma

*	aElement2.setAttribute('download', 'hulc.xml');   ???


IF (esta definido GET) >> miload()
