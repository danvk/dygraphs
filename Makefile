# Run the generate-combined.sh script.
# This Makefile isn't really necessary, but it serves as a "indicator"
# to new users that they need to do a "build" of sorts.
#
# Dean Wampler <dean@deanwampler.com> March 22, 2010

all: generate-combined

generate-combined:
	@echo Generating dygraph-combined.js
	@./generate-combined.sh

gwt: generate-gwt

generate-gwt:
	@echo Generating GWT JAR file
	@./generate-jar.sh
