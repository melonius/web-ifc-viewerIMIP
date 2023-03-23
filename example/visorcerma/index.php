<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <link rel="stylesheet" type="text/css" href="./styles.css" />
    <title>vCERMA</title>
</head>

<body>

<?php
	function human_filesize($bytes, $decimals = 2) {
	  $sz = 'BKMGTP';
	  $factor = floor((strlen($bytes) - 1) / 3);
	  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}
	function leeNivel($objeto,$nivelTAb) { 
		foreach ($objeto as $key => $value) {
			echo "<br>$nivelTAb $key <spam style='color:#122AB9;'> $value</spam>";
			if (count($value->attributes()) == 1) 
				foreach($value->attributes() as $a => $b) 
					echo "&emsp; <spam style='color:#4964C3;'>$a </spam> &emsp; <spam style='color:#22B322;'>$b</spam>";
			else
				foreach($value->attributes() as $a => $b) 
					echo "<br>$nivelTAb&#124;&emsp;&emsp; <spam style='color:#4964C3;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
			leeNivel($value,$nivelTAb."&#124;&emsp;&emsp;");
		}
	}

	if (isset (array_keys($_GET)[0]) ) {
		$archivoGET = array_keys($_GET)[0];
		$title = isset ($archivoGET) ? $archivoGET : 'imip';		//de momento no se usa es para cambiar el title de la página
	}
	
	if (isset ($archivoGET) ) {
		libxml_use_internal_errors(true);
		// simplexml_load_file — Interprets an XML file into an object    https://www.php.net/manual/en/function.simplexml-load-file.php
		$xml = simplexml_load_file("archivos/".$archivoGET.".xml"); // or die("Error:  Xml file load failure");

		if (false === $xml) {
			echo "Failed loading XML:\n <br>";
			foreach(libxml_get_errors() as $error) {
				echo "\t", $error->message;
			}
		} else {
			echo "	<script>	var miXml		= '".json_encode ($xml)."';	</script>		";
			echo "	<script>	var miXml2 = JSON.parse(miXml );	</script>		";
			echo "	<script>	console.log (miXml2);	</script>		";
		}
		echo "archivo: $archivoGET";

		echo "	<script>	var archivoGET		= '".$archivoGET."';	</script>		";

		foreach($xml->attributes() as $a => $b) {						// muestra los atributos iniciales    // atributtes  https://www.php.net/manual/en/simplexmlelement.attributes.php
			echo "<br> <spam style='color:#066806;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
		}
		 
		leeNivel($xml,"");

		echo "<br>=================================================fin de fichero<br>";
	}
	else {		//~ echo "No hay GET";
		echo " <div class='contenedor'>";
		echo " <div class='logo'><img src='img/logoIMIP.png' alt='logo IMIP'></div>";
		echo " <div class='table'>";
		foreach (glob("archivos/*.xml") as $nombre_fichero) {
			$sinRuta = substr($nombre_fichero, strrpos($nombre_fichero, "/")+1, strlen($nombre_fichero));
			$sinExtension = substr($sinRuta, 0, strrpos($sinRuta, "."));
			echo " 	<div class='row' onClick='parent.open(`index.php?$sinExtension`)' value='click here to visit home page'>
						<div class='cell colIni' >$sinExtension </div>
						<div class='cell textPeque'>" . human_filesize(filesize($nombre_fichero),2) . "</div>
						<div class='cell textPeque' >" . date('Y-m-d G:i:s', filemtime($nombre_fichero)) . "</div>
					</div>
				";
		}
		echo " </div>";
		echo " </div>";
	}

		//1.--------------------------
		//~ print_r($xml);

		//2.--------------------------
		//~ echo $xml;
		
		//3.--------------------------
		//~ $content = json_decode(json_encode($xml),TRUE);
		//~ var_dump($content);

		
		//4.--------------------------
		
		//~ function all_tag($xml, $tabulador){
			//~ $i=0; $name = "";
			//~ foreach ($xml as $k){
				//~ $tag = $k->getName();
				//~ $tag_value = $xml->$tag;
				//~ if ($name == $tag){ $i++;    }
				//~ $name = $tag;    
				//~ echo $tabulador.$tag .' <spam style="color:#0000ff;">'.$tag_value[$i].'</spam><br />';
				//~ // recursive
				//~ all_tag($xml->$tag->children(), "&nbsp;&nbsp;");
			//~ }
		//~ }
		//~ all_tag($xml, "&nbsp;");
		//5.--------------------------
		//~ echo "&nbsp;.nbsp<br>";
		//~ echo "&emsp;.emsp<br>";
		//~ echo "&ensp;.ensp<br>";
		//~ echo $xml->asXML();

?>
</body>
</html>
