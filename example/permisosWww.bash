#!/bin/bash
#echo "ejecutar  sudo bash /var/www/UBICACION/permisosWww.bash"

#http://www.improvisa.com/26-01-2012/permisos-optimos-para-archivos-de-apache-en-debian/

if [ $(whoami) != "root" ]
then
	echo  "ERROR _solo se puede ejecutar como root"  
	exit
fi

##adquiere el nombre de la ruta donde esta el script
ruta="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo $ruta

#~ source $ruta/config/instalacion		#adquiere variables del fichero instalacion: usuario
echo $usuario

if [ "$HOSTNAME" == "bis" ]  || [  "$HOSTNAME" == "nuc" ]  || [  "$HOSTNAME" == "brix" ] ; then
	usuario=mel
fi

set -x		#activa el debug   set +x lo desactiva


if [ "$ruta" == "" ]; then
	echo "ERROR ruta vacia"
	exit
else
	echo "$ruta ok"
	if [ -z ${usuario+x} ]; then 
		echo "ERROR: usuario $usuario no esta definido" ;
		exit
	else chown -R $usuario:www-data $ruta; 			## cambia el usuario y el grupo
	fi

	find $ruta/. -type d -exec chmod 750 {} \;					#drwxr-x---	solo directorios	
	find $ruta/. -type f -exec chmod 640 {} \;					#-rw-r-----	solo archivos  			solo puede editar prop y grupo
	find $ruta/. -name "*.php" -type f -exec chmod 644 {} \;	#-rw-r--r--	solo archivos  			solo puede editar prop y grupo
	find $ruta/. -name "*.js" -type f -exec chmod 644 {} \;		#-rw-r--r--	solo archivos  			solo puede editar prop y grupo
	find $ruta/. -name "*.debug" -type f -exec chmod 660 {} \;	#-rw-r--r--	solo archivos  			solo puede editar prop y grupo
	find $ruta/. -name "debug" -type d -exec chmod 770 {} \;	#-rw-r--r--	solo archivos  			solo puede editar prop y grupo
	
	#~ if [ -f $ruta/piwik/tmp ]; then chmod -R 777 $ruta/piwik/tmp; fi

	#~ chmod 755 $ruta/config/vai
fi







