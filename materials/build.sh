#!/bin/bash
set -e

FILAMENT_REPO=~/github/filament
FILAMENT_OUT=$FILAMENT_REPO/out/cmake-release
MATC=$FILAMENT_OUT/tools/matc/matc
MATINFO=$FILAMENT_OUT/tools/matinfo/matinfo
MATC_FLAGS='-O -a opengl -m material -p mobile'

$MATC $MATC_FLAGS -o tracks.filamat tracks.mat
echo $MATINFO -g 1 tracks.filamat
