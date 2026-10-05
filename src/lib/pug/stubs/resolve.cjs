// Pug uses `resolve` to find jstransformer filter packages in node_modules, which isn't possible in the browser
function unavailable(id) {
	throw new Error(
		`Cannot load "${id}": Pug filters from npm packages aren't available in the browser`
	);
}
module.exports = unavailable;
module.exports.sync = unavailable;
