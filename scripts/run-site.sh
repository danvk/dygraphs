#!/bin/sh
set -e
cd "$(dirname "$0")/../site/"
exec http-server -p 8083
