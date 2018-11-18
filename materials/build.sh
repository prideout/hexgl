#!/bin/bash
set -e

FILAMENT_REPO=~/github/filament
FILAMENT_OUT=$FILAMENT_REPO/out/cmake-release
MATC=$FILAMENT_OUT/tools/matc/matc
MATC_FLAGS='-O -a opengl -m material -p mobile'

$MATC $MATC_FLAGS -o tracks.filamat tracks.mat
