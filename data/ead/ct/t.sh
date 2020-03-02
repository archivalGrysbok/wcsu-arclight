#!/bin/bash
counter=0
for f in *.xml
do
  let counter++
  c=$(xml sel -t -m ead/eadheader/eadid/ -v @mainagencycode $f)
  if [[ "$c" != 'US-ct' ]]
  then
    echo $c
    echo $f
  fi
done
echo $counter

