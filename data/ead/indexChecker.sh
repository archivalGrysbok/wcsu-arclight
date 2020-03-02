cd /home/stevensb/arclight-demo-master/data/ead/	
for directory in */
	do
		cd $directory
			echo ""
			pwd
			for file in *.xml
				do 	
			#		echo "looking at $file"
					#replace . with -
					file2=${file//.xml/}
					echo "curl localhost:3000/catalog/"${file2//./-}
					curl -Is localhost:3000/catalog/${file2//./-} |grep "404"
				done	
		cd ..
	done



