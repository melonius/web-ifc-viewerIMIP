
<html>
   <body  style="line-height: 95%;" >

    <script >
      var GET = {};
      // console.log (document.location);
      console.log (document.location.toString());
      if(document.location.toString().indexOf('?') !== -1) {
          var query = document.location
                        .toString()
                        // get the query string
                        .replace(/^.*?\?/, '')
                        // and remove any existing hash string (thanks, @vrijdenker)
                        .replace(/#.*$/, '')
                        // .split('&');
          console.log (query);
     
          // for(var i=0, l=query.length; i<l; i++) {
          //   var aux = decodeURIComponent(query[i]).split('=');
          //   GET[aux[0]] = aux[1];
          // }
      }
    </script>



   
      <?php
      
      
		//~ function human_filesize($bytes, $decimals = 2) {
		  //~ $sz = 'BKMGTP';
		  //~ $factor = floor((strlen($bytes) - 1) / 3);
		  //~ return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
		//~ }

		//~ foreach (glob("archivos/*.xml") as $nombre_fichero) {
			//~ $sinRuta = substr($nombre_fichero, strrpos($nombre_fichero, "/")+1, strlen($nombre_fichero));
			//~ $sinExtension = substr($sinRuta, 0, strrpos($sinRuta, "."));
			//~ $datosActuales[] = [$sinExtension, human_filesize(filesize($nombre_fichero),2),date('Y-m-d G:i:s', filemtime($nombre_fichero))]  ;
		//~ }
		//~ $out = $datosActuales;
		//~ echo json_encode( $out);

      
      
      
      
      
      
		$fileList = glob('archivos/*');

		//Loop through the array that glob returned.
		//~ foreach($fileList as $filename){
		   //Simply print them out onto the screen.
		   //~ echo $filename, '<br>'; 
		//~ }
      
      
		libxml_use_internal_errors(true);
		//~ poblavallbona.ctehexml
		
		
		// simplexml_load_file — Interprets an XML file into an object    https://www.php.net/manual/en/function.simplexml-load-file.php
		
         //~ $xml = simplexml_load_file("archivos/entorno.xml"); // or die("Error:  Xml file load failure");
         //~ $xml = simplexml_load_file("poblavallbona.ctehexml"); // or die("Error:  Xml file load failure");
         //~ $xml = simplexml_load_file("elianafotov.ctehexml"); // or die("Error:  Xml file load failure");
          //~ $xml = simplexml_load_file("archivos/arasolmotornajuelosinvelas-Certificado-V21.xml"); // or die("Error:  Xml file load failure");
          //~ $xml = simplexml_load_file("archivos/arasolmotornajuelosinvelas.ctehexml"); // or die("Error:  Xml file load failure");
          $fichero="Prototipo_UPV_V1_2022_energychanges2.xml";
          $xml = simplexml_load_file("archivos/".$fichero); // or die("Error:  Xml file load failure");
        
         //------------- INFORMES .xml
         //~ $xml = simplexml_load_file("poblavallbona.xml"); // or die("Error:  Xml file load failure");
         //~ $xml = simplexml_load_file("elianafotov.xml"); // or die("Error:  Xml file load failure");
         
         //~ $xml = simplexml_load_file("pru.xml"); // or die("Error:  Xml file load failure");
		//~ $sxe = simplexml_load_string("<?xml version='1.0'><broken><xml></broken>");
		if (false === $xml) {
			echo "Failed loading XML:\n <br>";
			foreach(libxml_get_errors() as $error) {
				echo "\t", $error->message;
			}
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
		
		//~ foreach ($xml as $key => $value) {
			//~ if ($key != "EntradaGraficaLIDER") {
				//~ echo "<br>$key <spam style='color:#FF0000;'> $value</spam><br>";
				//~ foreach ( $xml->$key->children() as $key2 => $value2 ){
					//~ echo "&emsp;&emsp;$key2 <spam style='color:#0000ff;'> $value2</spam><br>";
					//~ foreach ( $xml->$key->$key2->children() as $key3 => $value3 ){
						//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;$key3 <spam style='color:#FF0000;'> $value3</spam><br>";
						//~ foreach ( $xml->$key->$key2->$key3->children() as $key4 => $value4 ){
							//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;$key4 <spam style='color:#FF0000;'> $value4</spam><br>";
							//~ foreach ( $xml->$key->$key2->$key3->$key4->children() as $key5 => $value5 ){
								//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;$key5 <spam style='color:#FF0000;'> $value5</spam><br>";
								//~ foreach ( $xml->$key->$key2->$key3->$key4->$key5->children() as $key6 => $value6 ){
									//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key6 <spam style='color:#FF0000;'> $value6</spam><br>";
									//~ foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->children() as $key7 => $value7 ){
										//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key7 <spam style='color:#FF0000;'> $value7</spam><br>";
										//~ foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->$key7->children() as $key8 => $value8 ){
											//~ echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key8 <spam style='color:#FF0000;'> $value8</spam><br>";
									//		foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->$key7->$key8>children() as $key9 => $value9 ){
									//			echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key9 <spam style='color:#FF0000;'> $value9</spam><br>";
									//		}
										//~ }
									//~ }
								//~ }
							//~ }
						//~ }
					//~ }
				//~ }
			//~ } //if
       //~ }
 /*
 foreach ($xml as $node) {
  echo $node['attributes']["useSIUnitsForResults"];
    //~ echo print_r ($node);
    //~ if(isset($node[$attribute])) {
    if(isset($node["@attribute"])) {
		echo "SI";
        return (string) $node[$attribute];
	}

}
 */   
 
 // atributtes  https://www.php.net/manual/en/simplexmlelement.attributes.php
 

    //~ if(isset ($xml->attributes())) echo "SI";
 
 
 
 
function leeNivel($objeto,$nivelTAb) { 
	foreach ($objeto as $key => $value) {			// $values es el nuevo objeto?
		echo "<br>$nivelTAb $key <spam style='color:#122AB9;'> $value</spam>";
		foreach($value->attributes() as $a => $b) {
			//~ echo $a,'="',$b,"\"\n";
			echo "<br>$nivelTAb&#124;&emsp;&emsp; <spam style='color:#066806;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
		}
		leeNivel($value,$nivelTAb."&#124;&emsp;&emsp;");
	}
}

$nivel = "";

echo $fichero;

foreach($xml->attributes() as $a => $b) {
    //~ echo $a,'="',$b,"\"\n";
    //~ echo "$a <spam style='color:#00ff00;'>$b</spam><br>";
	echo "<br> <spam style='color:#066806;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
}
 
leeNivel($xml,$nivel);

/*
foreach ($xml as $key => $value) {			// $values es el nuevo objeto?
			
			
				echo "<br>$key <spam style='color:#FF0000;'> $value</spam><br>";
				foreach($value->attributes() as $a => $b) {
					//~ echo $a,'="',$b,"\"\n";
					echo "$a <spam style='color:#00ff00;'>$b</spam><br>";
				}

				foreach ( $value as $key2 => $value2 ){
					echo "&emsp;&emsp;$key2 <spam style='color:#0000ff;'> $value2</spam><br>";
					
					
					
					
					foreach ( $xml->$key->$key2->children() as $key3 => $value3 ){
						echo "&emsp;&emsp;&#124;&emsp;&emsp;$key3 <spam style='color:#FF0000;'> $value3</spam><br>";
						foreach ( $xml->$key->$key2->$key3->children() as $key4 => $value4 ){
							echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;$key4 <spam style='color:#FF0000;'> $value4</spam><br>";
							foreach ( $xml->$key->$key2->$key3->$key4->children() as $key5 => $value5 ){
								echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;$key5 <spam style='color:#FF0000;'> $value5</spam><br>";
								foreach ( $xml->$key->$key2->$key3->$key4->$key5->children() as $key6 => $value6 ){
									echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key6 <spam style='color:#FF0000;'> $value6</spam><br>";
									foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->children() as $key7 => $value7 ){
										echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key7 <spam style='color:#FF0000;'> $value7</spam><br>";
										foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->$key7->children() as $key8 => $value8 ){
											echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key8 <spam style='color:#FF0000;'> $value8</spam><br>";
									//~ //		foreach ( $xml->$key->$key2->$key3->$key4->$key5->$key6->$key7->$key8>children() as $key9 => $value9 ){
									//~ //			echo "&emsp;&emsp;&#124;&emsp;&emsp;&#124;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;&emsp;$key9 <spam style='color:#FF0000;'> $value9</spam><br>";
									//~ //		}
										}
									}
								}
							}
						}
					}
				}
       }
      
 */      
       
      ?>
   </body>
</html>
