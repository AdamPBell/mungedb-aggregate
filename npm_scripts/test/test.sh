#!/bin/bash -e
# Script for running various package tests via the NPM 'test' sub-command.
# Configuration occurs either through the environment variables set thru the
# config section of the package.json file or via identical command line options.
###############################################################################
CMD_PWD=$(pwd)
CMD="$0"
CMD_DIR=$(cd "$(dirname "$CMD")"; pwd)

# Defaults and command line options
VERBOSE=
DEBUG=
NO_SYNTAX=
NO_UNIT=
NO_COVERAGE=
BUILD_SYSTEM=$BAMBOO_HOME

# Shortcut for running echo and then exit
die() {
	echo "$1" 1>&2
	[ -n "$2" ] && exit $2 || exit 1
}
# Show help function to be used below
show_help() {
	awk 'NR>1,/^(###|$)/{print $0; exit}' "$CMD"
	echo "USAGE: $(basename "$CMD") [arguments]"
	echo "ARGS:"
	MSG=$(awk '/^NARGS=-1; while/,/^esac; done/' "$CMD" | sed -e 's/^[[:space:]]*/  /' -e 's/|/, /' -e 's/)//' | grep '^  -')
	EMSG=$(eval "echo \"$MSG\"")
	echo "$EMSG"
}
# Parse command line options (odd formatting to simplify show_help() above)
NARGS=-1; while [ "$#" -ne "$NARGS" ]; do NARGS=$#; case $1 in
	# SWITCHES
	-h|--help)        # This help message
		show_help; exit 1; ;;
	-d|--debug)       # Enable debugging messages (implies verbose)
		DEBUG=$(( $DEBUG + 1 )) && VERBOSE="$DEBUG" && shift && echo "#-INFO: DEBUG=$DEBUG (implies VERBOSE=$VERBOSE)"; ;;
	-v|--verbose)     # Enable verbose messages
		VERBOSE=$(( $VERBOSE + 1 )) && shift && echo "#-INFO: VERBOSE=$VERBOSE"; ;;
	-S|--no-syntax)   # Disable syntax tests
		NO_SYNTAX=$(( $NO_SYNTAX + 1 )) && shift && echo "#-INFO: NO_SYNTAX=$NO_SYNTAX"; ;;
	-U|--no-unit)     # Disable unit tests
		NO_UNIT=$(( $NO_UNIT + 1 )) && shift && echo "#-INFO: NO_UNIT=$NO_UNIT"; ;;
	-C|--no-coverage) # Enable coverage tests
		NO_COVERAGE=$(( $NO_COVERAGE + 1 )) && shift && echo "#-INFO: NO_COVERAGE=$NO_COVERAGE"; ;;
	-B|--build-system) # Enable options needed for the build system
		BUILD_SYSTEM=$(( $BUILD_SYSTEM + 1 )) && shift && echo "#-INFO: BUILD_SYSTEM=$BUILD_SYSTEM"; ;;
	# PAIRS
#	-t|--thing)	 # Set a thing to a value (DEFAULT: $THING)
#		shift && THING="$1" && shift && [ -n "$VERBOSE" ] && echo "#-INFO: THING=$THING"; ;;
esac; done

###############################################################################

[ $# -eq 0 ] || die "ERROR: Unexpected commands!"

# Enable debug messages in silly mode
[ "$npm_config_loglevel" = "silly" ] && DEBUG=1
[ -n "$DEBUG" ] && set -x

# Show all of the package config variables for debugging if non-standard loglevel
[ -n "$npm_config_loglevel" ] && [ "$npm_config_loglevel" != "http" ] && VERBOSE=1
[ -n "$VERBOSE" ] && env | egrep -i '^(npm|jenkins)_' | sort | sed 's/^/#-INFO: /g'

# Change to root directory of package
cd "$CMD_DIR/../../"	 # assuming that this is $PKG_ROOT/npm_scripts/MyAwesomeScript/MyAwesomeScript.sh or similar
[ -f "package.json" ] || die "ERROR: Unable to find the \"package.json\" file in \"$(pwd)\"!"

# Basic sanity check for node_modules directory (to ensure that 'npm install' has been run)
[ -d "node_modules" ] || die "ERROR: Unable to find the \"node_modules\" dir in \"$(pwd)\"!. Run \"npm install\" first!"

# Determing package name
PKG_NAME="$npm_package_name"
[ -n "$PKG_NAME" ] || PKG_NAME="$npm_config_package_name"
[ -n "$PKG_NAME" ] || PKG_NAME=$(node -e 'console.log(require("./package.json").name)')
[ -n "$PKG_NAME" ] || die "ERROR: Unable to determine package name! Broken package?"

# Determine code directory
CODE_DIR="$npm_package_config_code_dir"
[ -n "$CODE_DIR" ] && [ -d "$CODE_DIR" ] || CODE_DIR="$npm_config_default_code_dir"
[ -n "$CODE_DIR" ] && [ -d "$CODE_DIR" ] || CODE_DIR="lib"
[ -n "$CODE_DIR" ] && [ -d "$CODE_DIR" ] || die "ERROR: Unable to find code directory at \"$CODE_DIR\"!"
CODE_DIR=$(echo "$CODE_DIR" | sed 's/\/$//')	# remove trailing slash
[ -n "$VERBOSE" ] && echo "CODE_DIR=$CODE_DIR"

# Determine test directory
TEST_DIR="$npm_package_config_test_dir"
[ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ] || TEST_DIR="$npm_config_default_test_dir"
[ -n "$TEST_DIR" ] && [ -d "$TEST_DIR" ] || TEST_DIR="test/lib"
[ -d "$TEST_DIR" ] || die "ERROR: Unable to find test directory at \"$TEST_DIR\"!"
TEST_DIR=$(echo "$TEST_DIR" | sed 's/\/$//')	# remove trailing slash
[ -n "$VERBOSE" ] && echo "TEST_DIR=$TEST_DIR"

# Helper to check if given file is valid XML
XMLLINT_BIN=$(which xmllint || true)
validate_xml() {
	REPORT_FILE="$1"
	if [ -n "$XMLLINT_BIN" ]; then
		if [ -s "$REPORT_FILE" ]; then
			"$XMLLINT_BIN" --noout "$REPORT_FILE" || die "ERROR: Invalid XML in \"$REPORT_FILE\"!"
		else
			echo "WARNING: expected XML data in empty file at \"$REPORT_FILE\"."
		fi
	else
		echo "WARNING: xmllint not in PATH so skipping XML check of \"$REPORT_FILE\"."
	fi
}

# Syntax tests
[ "$npm_package_config_test_syntax" = "false" ] && NO_SYNTAX=1
if [ -z "$NO_SYNTAX" ]; then
	echo "Running syntax checks ..."

	# Deps
	JSHINT_BIN="$npm_package_config_jshint_bin"
	#[ -n "$JSHINT_BIN" ] && [ -x "$JSHINT_BIN" ] || JSHINT_BIN=$(which jshint || true)
	[ -n "$JSHINT_BIN" ] && [ -x "$JSHINT_BIN" ] || JSHINT_BIN="./node_modules/.bin/jshint"
	[ -n "$JSHINT_BIN" ] && [ -x "$JSHINT_BIN" ] || JSHINT_BIN=$(node -e 'console.log("%s/bin/jshint",require("path").dirname(require.resolve("jshint/package.json")))')
	[ -n "$JSHINT_BIN" ] && [ -x "$JSHINT_BIN" ] || die "ERROR: Unable to find 'jshint' binary! Install via 'npm install jshint' to proceed!"

	# Prep
	JSHINT_OUTPUT_DIR="$npm_package_config_jshint_output_dir"
	[ -n "$JSHINT_OUTPUT_DIR" ] || JSHINT_OUTPUT_DIR="$npm_config_default_jshint_output_dir"
	[ -n "$JSHINT_OUTPUT_DIR" ] || [ -n "$npm_config_default_reports_output_dir" ] && JSHINT_OUTPUT_DIR="$npm_config_default_reports_output_dir/syntax"
	[ -n "$JSHINT_OUTPUT_DIR" ] || JSHINT_OUTPUT_DIR="reports/syntax"
	[ -d "$JSHINT_OUTPUT_DIR" ] || mkdir -p "$JSHINT_OUTPUT_DIR" || die "ERROR: Unable to mkdir \"$JSHINT_OUTPUT_DIR\", the jshint output dir!"

	# Exec require on all js files
	echo "  Testing via NodeJS require function ..."
    node -e "[$(find "./$CODE_DIR" "./$TEST_DIR" -type f -name '*.js' -not -iregex '.*/public/.*' -not -iregex '.*/node_modules/.*' | sed -e 's/^/ "/' -e 's/$/",/')].forEach(function(req){try{require(req)}catch(e){console.error({file:req,error:e});console.error(e.stack);process.exit(1)}});"	\
		|| die "ERROR: NodeJS require error!"

	# Exec jshint to get jslint output	#TODO: is this even needed?
	echo "  Checking via JSHint jslint reporter ..."
	REPORT_FILE="$JSHINT_OUTPUT_DIR/$PKG_NAME-jshint-jslint.xml"
	"$JSHINT_BIN" --extra-ext ".js,.json" --jslint-reporter "$CODE_DIR" "$TEST_DIR" &> "$REPORT_FILE"	\
		|| die "ERROR: JSHint errors on jslint reporter! $(echo; cat "$REPORT_FILE")"
	[ -n "$VERBOSE" ] && echo "REPORT OUTPUT: $REPORT_FILE" && cat "$REPORT_FILE" && echo
	validate_xml "$REPORT_FILE" || die "ERROR: INVALID REPORT FILE!"

	# Exec jshint to get checkstyle output
	echo "  Checking via JSHint checkstyle reporter ..."
	REPORT_FILE="$JSHINT_OUTPUT_DIR/$PKG_NAME-jshint-checkstyle.xml"
	"$JSHINT_BIN" --extra-ext ".js,.json" --checkstyle-reporter "$CODE_DIR" "$TEST_DIR" > "$REPORT_FILE"	\
		|| die "ERROR: JSHint errors on checkstyle reporter! $(echo; cat "$REPORT_FILE")"
	echo "    ERRORS: $(egrep -c '<error .* severity="error"' "$REPORT_FILE")"
	echo "    WARNINGS: $(egrep -c '<error .* severity="warning"' "$REPORT_FILE")"
	[ -n "$VERBOSE" ] && echo "REPORT OUTPUT: $REPORT_FILE" && cat "$REPORT_FILE" && echo
	validate_xml "$REPORT_FILE" || die "ERROR: INVALID REPORT FILE!"

	echo "  Checking custom code rules ..."
	BAD_INSTANCEOF=$(egrep --include '*.js' --recursive ' instanceof (Boolean|Number|String)' "$CODE_DIR" || true)
	[ -z "$BAD_INSTANCEOF" ] || die "ERROR: Found uses of instanceof that are likely to be broken! $(echo; echo "$BAD_INSTANCEOF")"

	echo
fi

# Used by unit and coverage tests.
MOCHA_BIN="$npm_package_config_mocha_bin"
[ -n "$MOCHA_BIN" ] && [ -x "$MOCHA_BIN" ] || MOCHA_BIN=$(which mocha || true)
[ -n "$MOCHA_BIN" ] && [ -x "$MOCHA_BIN" ] || die "ERROR: Unable to find 'mocha' binary! Install via 'npm install mocha' to proceed!"

# Unit tests
[ "$npm_package_config_test_unit" = "false" ] && NO_UNIT=1
if [ -z "$NO_UNIT" ]; then
	echo "Running unit tests ..."

	# Prep
	MOCHA_REPORTER="spec"
	if [ -n "$BUILD_SYSTEM" ]; then
		MOCHA_REPORTER="$npm_package_config_test_reporter"
		[ -n "$MOCHA_REPORTER" ] || MOCHA_REPORTER="xunit"
	fi
	MOCHA_OUTPUT_DIR="$npm_package_config_mocha_output_dir"
	[ -n "$MOCHA_OUTPUT_DIR" ] || MOCHA_OUTPUT_DIR="$npm_config_default_mocha_output_dir"
	[ -n "$MOCHA_OUTPUT_DIR" ] || [ -n "$npm_config_default_reports_output_dir" ] && MOCHA_OUTPUT_DIR="$npm_config_default_reports_output_dir/unit"
	[ -n "$MOCHA_OUTPUT_DIR" ] || MOCHA_OUTPUT_DIR="reports/unit"
	[ -d "$MOCHA_OUTPUT_DIR" ] || mkdir -p "$MOCHA_OUTPUT_DIR" || die "ERROR: Unable to mkdir \"$MOCHA_OUTPUT_DIR\", the mocha output dir!"

	# Exec
	[ "$MOCHA_REPORTER" == "xunit" ] && UNIT_TEST_EXTENSION=xml || UNIT_TEST_EXTENSION=txt
	[ "$MOCHA_REPORTER" == "xunit" ] && MOCHA_EXTRA_FLAGS= || MOCHA_EXTRA_FLAGS=--colors

	REPORT_FILE_BASE="$MOCHA_OUTPUT_DIR/$PKG_NAME-report"
	REPORT_FILE="$REPORT_FILE_BASE.$UNIT_TEST_EXTENSION"
	REPORT_FILE_ERR="$REPORT_FILE_BASE.err"

	LOGGER_PREFIX='' LOGGER_LEVEL=NOTICE "$MOCHA_BIN" --ui exports --reporter "$MOCHA_REPORTER" $MOCHA_EXTRA_FLAGS --recursive "$TEST_DIR" 2> "$REPORT_FILE_ERR" 1> "$REPORT_FILE"	\
		|| die "ERROR: Mocha errors during unit tests! $(echo; cat "$REPORT_FILE"; cat "$REPORT_FILE_ERR")"
	[ -n "$VERBOSE" ] && echo "REPORT OUTPUT: $REPORT_FILE" && cat "$REPORT_FILE" && echo

	[ -s "$REPORT_FILE" ] || die "ERROR: no report data, units tests probably failed!"

	echo
fi

# Coverage tests
[ "$npm_package_config_test_coverage" = "false" ] && NO_COVERAGE=1
if [ -z "$NO_COVERAGE" ]; then
	echo "Running coverage tests ..."

	# Deps
	JSCOVERAGE_BIN="$npm_package_config_jscoverage_bin"
	#[ -n "$JSCOVERAGE_BIN" ] && [ -x "$JSCOVERAGE_BIN" ] || JSCOVERAGE_BIN=$(which jscoverage || true)
	[ -n "$JSCOVERAGE_BIN" ] && [ -x "$JSCOVERAGE_BIN" ] || JSCOVERAGE_BIN="./node_modules/.bin/jscoverage"
	[ -n "$JSCOVERAGE_BIN" ] && [ -x "$JSCOVERAGE_BIN" ] || JSCOVERAGE_BIN=$(node -e 'console.log("%s/bin/jscoverage",require("path").dirname(require.resolve("jscoverage/package.json")))')
	[ -n "$JSCOVERAGE_BIN" ] && [ -x "$JSCOVERAGE_BIN" ] || die "$(cat<<-ERROR_DOCS_EOF
		ERROR: Unable to find node.js jscoverage binary! Run 'npm install' first!
	ERROR_DOCS_EOF
	)"

	# Prep
	JSCOVERAGE_OUTPUT_DIR="$npm_package_config_jscoverage_output_dir"
	[ -n "$JSCOVERAGE_OUTPUT_DIR" ] || JSCOVERAGE_OUTPUT_DIR="$npm_config_default_jscoverage_output_dir"
	[ -n "$JSCOVERAGE_OUTPUT_DIR" ] || [ -n "$npm_config_default_reports_output_dir" ] && JSCOVERAGE_OUTPUT_DIR="$npm_config_default_reports_output_dir/html/jscoverage"
	[ -n "$JSCOVERAGE_OUTPUT_DIR" ] || JSCOVERAGE_OUTPUT_DIR="reports/html/jscoverage"
	[ -d "$JSCOVERAGE_OUTPUT_DIR" ] || mkdir -p "$JSCOVERAGE_OUTPUT_DIR" || die "ERROR: Unable to mkdir \"$MOCHA_OUTPUT_DIR\", the mocha output dir!"
	JSCOVERAGE_TMP_DIR="$CODE_DIR.jscoverage"
	if [ -d "$JSCOVERAGE_TMP_DIR" ]; then
		rm -fr "$JSCOVERAGE_TMP_DIR" || die "ERROR: Unable to remove obstruting \"$JSCOVERAGE_TMP_DIR\" temp directory!"
	fi

	# Exec
	#JSCOVERAGE_EXCLUDES="$(find "$CODE_DIR" -type f -not -path '*/.svn/*' -not -name '*.js' | xargs -n1 basename | sort -u | tr '\n' , | sed 's/,$//')"
	"$JSCOVERAGE_BIN" "$CODE_DIR" "$JSCOVERAGE_TMP_DIR" --exclude "$JSCOVERAGE_EXCLUDES"
	# - Backup the actual code and replace it with jscoverage results
	[ -n "$VERBOSE" ] && echo "Replacing $CODE_DIR with $JSCOVERAGE_TMP_DIR ..."

	REPORT_FILE_BASE="$JSCOVERAGE_OUTPUT_DIR/$PKG_NAME-coverage"
	REPORT_FILE="$REPORT_FILE_BASE.html"
	REPORT_FILE_ERR="$REPORT_FILE_BASE.err"

	mv "$CODE_DIR" "$CODE_DIR.ORIGINAL"	\
		&& mv "$JSCOVERAGE_TMP_DIR" "$CODE_DIR"	\
		&& LOGGER_PREFIX='' LOGGER_LEVEL=NOTICE "$MOCHA_BIN" --ui "exports" --reporter "html-cov" --recursive "$TEST_DIR" 2> "$REPORT_FILE_ERR" | sed 's|'"`pwd`/lib/"'||g' > "$REPORT_FILE"	\
		|| echo "WARNING: JSCoverage: insufficient coverage (exit code $?)."
#		|| die "ERROR: JSCoverage errors during coverage tests! $(rm -fr "$CODE_DIR" && mv "$CODE_DIR.ORIGINAL" "$CODE_DIR"; echo; cat "$REPORT_FILE")"
#	[ -n "$VERBOSE" ] && echo "REPORT OUTPUT: $REPORT_FILE" && cat "$REPORT_FILE" && echo

	LOGGER_PREFIX='' LOGGER_LEVEL=NOTICE "$MOCHA_BIN" --ui "exports" --reporter "json-cov" --recursive "$TEST_DIR" 2> "$REPORT_FILE_ERR" > "$REPORT_FILE_BASE.json"

	# Cleanup
	rm -rf "$CODE_DIR"	\
		&& mv "$CODE_DIR.ORIGINAL" "$CODE_DIR"	\
		|| die "ERROR: Unable to put code directory \"$CODE_DIR.ORIGNAL\" back where it belongs!"

	node -e "if (JSON.parse(require('fs').readFileSync('$REPORT_FILE_BASE.json')).coverage < 91) { console.error('Less than 91% code coverage! See code coverage report at https://bamboo.rd.rcg.local/$bamboo_buildplanname-$bamboo_buildnumber/artifact/JOB1/code-coverage/$PKG_NAME-coverage.html'); process.exit(1); }"

	echo
fi

# This is used by both the PMD and jscheckstyle.
ANALYSIS_TARGET="$npm_package_config_analyze_dirs"
[ -n "$ANALYSIS_TARGET" ] || ANALYSIS_TARGET="$CODE_DIR"

# Static analysis.
[ "$npm_package_config_test_static_analysis" = "false" ] && NO_STATIC_ANALYSIS=1
if [ -z "$NO_STATIC_ANALYSIS" ]; then
	echo "Running static analysis ..."

	PMD_BIN="$npm_package_config_pmd_bin"
	[ -n "$PMD_BIN" ] && [ -x "$PMD_BIN" ] || PMD_BIN="/srv/jenkins/tools/pmd/bin/run.sh"

	if [ -n "$PMD_BIN" ] && [ -x "$PMD_BIN" ]; then

        PMD_OUTPUT_DIR="$npm_package_config_pmd_output_dir"
        [ -n "$PMD_OUTPUT_DIR" ] || PMD_OUTPUT_DIR="$npm_package_config_pmd_output_dir"
        [ -n "$PMD_OUTPUT_DIR" ] || [ -n "$npm_config_default_reports_output_dir" ] && PMD_OUTPUT_DIR="$npm_config_default_reports_output_dir/static-analysis"
        [ -n "$PMD_OUTPUT_DIR" ] || PMD_OUTPUT_DIR="reports/static-analysis"
        [ -d "$PMD_OUTPUT_DIR" ] || mkdir -p "$PMD_OUTPUT_DIR" || die "ERROR: Unable to mkdir \"$PMD_OUTPUT_DIR\", the PMD static analysis output dir!"

        REPORT_FILE="$PMD_OUTPUT_DIR/$PKG_NAME-cpd.xml"

        "$PMD_BIN" cpd --minimum-tokens 90 $(for TARGET in $ANALYSIS_TARGET; do echo "--files $TARGET "; done) --format xml --language js > "$REPORT_FILE" || echo "WARNING: PMD found issues (exit code $?)."
		validate_xml "$REPORT_FILE" || die "ERROR: INVALID REPORT FILE!"

        echo
    fi
fi

# jscheckstyle, different than mocha's checkstyle.
[ "$npm_package_config_test_jscheckstyle" = "false" ] && NO_JSCHECKSTYLE=1
if [ -z "$NO_JSCHECKSTYLE" ]; then
	echo "Running jscheckstyle ..."

	JSCHECKSTYLE_BIN="$npm_package_config_jscheckstyle_bin"
	#[ -n "$JSCHECKSTYLE_BIN" ] && [ -x "$JSCHECKSTYLE_BIN" ] || JSCHECKSTYLE_BIN=$(which jscheckstyle || true)
	[ -n "$JSCHECKSTYLE_BIN" ] && [ -x "$JSCHECKSTYLE_BIN" ] || JSCHECKSTYLE_BIN="./node_modules/.bin/jscheckstyle"
	[ -n "$JSCHECKSTYLE_BIN" ] && [ -x "$JSCHECKSTYLE_BIN" ] || JSCHECKSTYLE_BIN=$(node -e 'console.log("%s/bin/jscheckstyle",require("path").dirname(require.resolve("jscheckstyle/package.json")))')
	[ -n "$JSCHECKSTYLE_BIN" ] && [ -x "$JSCHECKSTYLE_BIN" ] || die "ERROR: Unable to find 'jscheckstyle' binary! Install via 'npm install jscheckstyle' to proceed!"

	JSCHECKSTYLE_OUTPUT_DIR="$npm_package_config_jscheckstyle_output_dir"
	[ -n "$JSCHECKSTYLE_OUTPUT_DIR" ] || JSCHECKSTYLE_OUTPUT_DIR="$npm_package_config_jscheckstyle_output_dir"
	[ -n "$JSCHECKSTYLE_OUTPUT_DIR" ] || [ -n "$npm_config_default_reports_output_dir" ] && JSCHECKSTYLE_OUTPUT_DIR="$npm_config_default_reports_output_dir/jscheckstyle"
	[ -n "$JSCHECKSTYLE_OUTPUT_DIR" ] || JSCHECKSTYLE_OUTPUT_DIR="reports/jscheckstyle"
	[ -d "$JSCHECKSTYLE_OUTPUT_DIR" ] || mkdir -p "$JSCHECKSTYLE_OUTPUT_DIR" || die "ERROR: Unable to mkdir \"$JSCHECKSTYLE_OUTPUT_DIR\", the jscheckstyle output dir!"

    REPORT_FILE="$JSCHECKSTYLE_OUTPUT_DIR/$PKG_NAME-jscheckstyle.xml"

    "$JSCHECKSTYLE_BIN" --checkstyle $ANALYSIS_TARGET 2> /dev/null 1> "$REPORT_FILE" || echo "WARNING: jscheckstyle: code is too complex"
	validate_xml "$REPORT_FILE" || die "ERROR: INVALID REPORT FILE!"
fi

