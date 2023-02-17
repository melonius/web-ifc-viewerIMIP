
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
		
		$fichero="ES.ME.AB.04.Gen._B.CS_A.UP_CR.xml";
		$xml = simplexml_load_file("archivos/".$fichero); // or die("Error:  Xml file load failure");
        
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
 
 
 
 
function leeNivel($objeto,$nivelTAb,$contadorNivel) {
	++$contadorNivel;
	//~ echo "<br>$contadorNivel";
	foreach ($objeto as $key => $value) {			// $values es el nuevo objeto?
		if ( $contadorNivel > 2)
			echo "<br>$nivelTAb $key <spam style='color:#122AB9;'> $value</spam>";
		if (count($value->attributes()) == 1) 
			foreach($value->attributes() as $a => $b) 
				if ( $contadorNivel > 2)
					echo "&emsp; <spam style='color:#4964C3;'>$a </spam> &emsp; <spam style='color:#22B322;'>$b</spam>";
		else
			foreach($value->attributes() as $a => $b) 
				if ( $contadorNivel > 2)
					echo "<br>$nivelTAb&#124;&emsp;&emsp; <spam style='color:#4964C3;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
		if ( $contadorNivel > 2) 
			$nivelnuevo = $nivelTAb."&#124;&emsp;&emsp;";
		//~ leeNivel($value,$nivelTAb,$contadorNivel);
		leeNivel($value,$nivelnuevo,$contadorNivel);
	}
}

$nivel = "";


echo $fichero;

foreach($xml->attributes() as $a => $b) {						// muestra los atributos iniciales
	echo "<br> <spam style='color:#066806;'>$a </spam>  <spam style='color:#22B322;'>$b</spam>";
}
 
leeNivel($xml,$nivel,-2);

echo "<hr/><hr/><br><br>";
      
      ?>
   </body>
</html>
