/**
 * External dependencies
 */
const { escapeRegExp, merge } = require( 'lodash' );

/**
 * Internal dependencies
 */

const { version } = require( './package' );

/**
 * Regular expression string matching a SemVer string with equal major/minor to
 * the current package version. Used in identifying deprecations.
 *
 * @type {string}
 */
const majorMinorRegExp =
	escapeRegExp( version.replace( /\.\d+$/, '' ) ) + '(\\.\\d+)?';

module.exports = {
	extends: ["react-app"]
};
