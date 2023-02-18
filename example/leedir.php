<?php

	function human_filesize($bytes, $decimals = 2) {
	  $sz = 'BKMGTP';
	  $factor = floor((strlen($bytes) - 1) / 3);
	  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}

	//~ echo print_r ( $_GET). "<br>";
	//~ echo print_r ( $_GET[0]). "<br>";
	//~ echo array_keys($_GET)[0]. "<br>";
	
	// $archIFC = array_keys($_GET)[0];
	// $title = isset ($archIFC) ? $archIFC : 'imip';
	
	// if (isset ($archIFC) ) {
	// 	echo "	<script>	var archIFC		= '".$archIFC."';	</script>		";
	// 	echo "
	// 		<aside class='side-menu' id='side-menu-left'></aside>
	// 		<div id='viewer-container'></div>
	// 		<div id='loading-overlay' class='loading-overlay hidden'>
	// 		<h1 id='loading-progress' class='loading-progress'></h1>
	// 		</div>
	// 		<script async src='files/opencv.js' type='text/javascript'></script>
	// 		<script type='module' src='./build/main.js'></script>
	// 	";
	// }
	// else {
		//~ echo "No hay GET";
		// echo " <div class='contenedor'>";
		// echo " <div class='logo'><img src='img/logoIMIP.png' alt='logo IMIP'></div>";
		// echo " <div class='table'>";

		// $listaArchivosXml = glob("models/*.xml");
		// echo print_r( $listaArchivosXml);
		foreach (glob("models/*.xml") as $nombre_fichero_xml) {
			$sinRuta2 = substr($nombre_fichero_xml, strrpos($nombre_fichero_xml, "/")+1, strlen($nombre_fichero_xml));
			$sinExtension2 = substr($sinRuta2, 0, strrpos($sinRuta2, "."));
			$listaXmls[$sinExtension2] = [ human_filesize(filesize($nombre_fichero_xml),2),date('Y-m-d G:i:s', filemtime($nombre_fichero_xml))]  ;
		}
		// echo print_r( $listaXmls);

		foreach (glob("models/*.ifc") as $nombre_fichero) {
			$sinRuta = substr($nombre_fichero, strrpos($nombre_fichero, "/")+1, strlen($nombre_fichero));
			$sinExtension = substr($sinRuta, 0, strrpos($sinRuta, "."));
			if (in_array($sinExtension,array_keys($listaXmls))) {
				// echo $listaXmls[$sinExtension][0]."\n";
				// echo $listaXmls[$sinExtension][1]."\n";
				$out[] = [$sinExtension, human_filesize(filesize($nombre_fichero),2),date('Y-m-d G:i:s', filemtime($nombre_fichero))
				,$listaXmls[$sinExtension][0], $listaXmls[$sinExtension][1]]  ;
			}else{
				$out[] = [$sinExtension, human_filesize(filesize($nombre_fichero),2),date('Y-m-d G:i:s', filemtime($nombre_fichero))]  ;
			} 

			
		}
		// $out = $datosActuales;
		echo json_encode( $out);
		// echo print_r( $out);

		

	// }

?>
