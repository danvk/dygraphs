# Run the generate-combined.sh script.
# This Makefile isn't really necessary, but it serves as a "indicator"
# to new users that they need to do a "build" of sorts.
#
# Dean Wampler <dean@deanwampler.com> March 22, 2010

all: test generate-combined generate-documentation

clean:
	@echo cleaning...
	@cp .dygraph-combined-clean.js dygraph-combined.js
	rm docs/options.html

generate-combined:
	@echo Generating dygraph-combined.js
	@./generate-combined.sh

generate-documentation:
	@echo Generating docs/options.html
	@./generate-documentation.py > docs/options.html
	@chmod a+r docs/options.html

gwt: generate-gwt

generate-gwt:
	@echo Generating GWT JAR file
	@./generate-jar.sh

test:
	@./test.sh

lint:
	@./lint.sh
